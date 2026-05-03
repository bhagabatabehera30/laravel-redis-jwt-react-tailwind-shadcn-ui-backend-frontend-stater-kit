# React Frontend with Authentication and Dashboard

A modular React application built with Vite, featuring authentication, internationalization, theme support, and a dashboard.

## Features

- **Authentication**: Login system with API integration
- **Dashboard**: Protected dashboard page
- **Internationalization**: Support for English and Arabic (LTR/RTL)
- **Theme Support**: Light and dark mode
- **UI Components**: Built with shadcn/ui and Tailwind CSS
- **TypeScript**: Full TypeScript support

## Tech Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React i18next
- Next Themes

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5174](http://localhost:5174) in your browser.

## Project Structure

- `src/components/` - Reusable UI components
- `src/contexts/` - React contexts for state management
- `src/locales/` - Translation files
- `src/lib/` - Utility functions

## API Integration

The app integrates with a login API at `http://localhost/api/auth/login`.

Example request:
```bash
curl --location 'http://localhost/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email":"admin@test.com",
    "password":"Abc@123456"
}'
```

## Building for Production

```bash
npm run build
```

## Linting

```bash
npm run lint
```
