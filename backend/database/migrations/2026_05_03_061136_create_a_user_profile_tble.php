<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->index();
            $table->text('author_bio')->nullable();
            $table->string('gender', 58)->nullable();
            $table->string('profession', 58)->nullable();
            $table->text('user_pic')->nullable();
            $table->string('facebook_link')->nullable();
            $table->string('youtube_link')->nullable();
            $table->string('linkedin_link')->nullable();
            $table->string('instagram_link')->nullable();
            $table->string('twitter_link')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
