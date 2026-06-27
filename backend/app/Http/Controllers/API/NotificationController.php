<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Notifications\SystemNotification;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Notifications', description: 'API Endpoints for User Notifications')]
class NotificationController extends Controller
{
    #[OA\Get(
        path: '/api/v1/notifications',
        summary: 'Get all unread notifications',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of unread notifications',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'notifications', type: 'array', items: new OA\Items(type: 'object'))
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated')
        ]
    )]
    public function index(Request $request)
    {
        $user = auth('api')->user();

        // Get unread notifications
        $notifications = $user->unreadNotifications;

        return response()->json([
            'success' => true,
            'notifications' => $notifications
        ]);
    }

    #[OA\Post(
        path: '/api/v1/notifications/mark-as-read',
        summary: 'Mark notifications as read',
        description: 'Marks a specific notification as read if ID is provided, otherwise marks all unread notifications as read.',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'id', type: 'string', description: 'Optional notification ID to mark as read')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Notifications marked as read',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Notifications marked as read')
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated')
        ]
    )]
    public function markAsRead(Request $request)
    {
        $user = auth('api')->user();
        $id = $request->input('id');

        if ($id) {
            $notification = $user->unreadNotifications->where('id', $id)->first();
            if ($notification) {
                $notification->markAsRead();
            }
        } else {
            // Mark all as read
            $user->unreadNotifications->markAsRead();
        }

        return response()->json([
            'success' => true,
            'message' => 'Notifications marked as read'
        ]);
    }

    #[OA\Post(
        path: '/api/v1/notifications/test',
        summary: 'Trigger a test notification',
        description: 'Generates a dummy test notification for the authenticated user for debugging purposes.',
        security: [['bearerAuth' => []]],
        tags: ['Notifications'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'title', type: 'string', example: 'Test Title'),
                    new OA\Property(property: 'message', type: 'string', example: 'Test message generated via Swagger'),
                    new OA\Property(property: 'type', type: 'string', example: 'info')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Test notification sent successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'success', type: 'boolean', example: true),
                        new OA\Property(property: 'message', type: 'string', example: 'Test notification sent')
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated')
        ]
    )]
    public function test(Request $request)
    {
        $user = auth('api')->user();
        
        $title = $request->input('title', 'Test Notification');
        $message = $request->input('message', 'This is a test notification generated via API.');
        $type = $request->input('type', 'info');

        $user->notify(new SystemNotification($title, $message, $type));

        return response()->json([
            'success' => true,
            'message' => 'Test notification sent'
        ]);
    }
}
