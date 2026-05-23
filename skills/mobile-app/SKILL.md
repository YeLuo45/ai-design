# Skill: Mobile App

## Overview

The **mobile-app** skill designs mobile application interfaces with device-specific considerations. It creates touch-friendly layouts, app-like navigation patterns, and supports various mobile UI conventions across iOS and Android platforms.

## Output Format

- **Primary**: Standalone HTML file optimized for mobile viewport
- **Styling**: Tailwind CSS with mobile-first approach
- **Device Frames**: Support for iPhone, Pixel, and other device chrome

## Capabilities

### Mobile Components
- Bottom tab navigation
- Header with back button and actions
- List items with icons, avatars, and metadata
- Cards with images and action buttons
- Pull-to-refresh indicators
- Floating action buttons (FAB)
- Modal sheets and bottom drawers

### App Patterns
- Feed/timeline layouts (social, news)
- Detail views with hero images
- Form screens (login, signup, settings)
- Chat/messaging interfaces
- Profile pages
- Settings and preferences

### Interaction
- Touch-optimized tap targets (44px minimum)
- Swipe gestures (swipe to delete, reveal actions)
- Loading states and skeleton screens
- Toast notifications
- Haptic feedback simulation (visual cues)

## Example Prompt

```
Create a mobile feed screen for a social app with:
- Top header with profile avatar and notification bell
- Scrollable feed with image posts
- Each post has user info, image, like/comment counts
- Bottom navigation with Home, Search, Add, Messages, Profile
- Pull-to-refresh indicator
- Like button with heart animation
```

## Output Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Mobile App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Mobile-specific styles */
    body { max-width: 430px; margin: 0 auto; }
    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  </style>
</head>
<body class="bg-gray-100">
  <!-- Status Bar placeholder -->
  <!-- Header -->
  <!-- Content Area -->
  <!-- Bottom Navigation -->
</body>
</html>
```

## Technical Notes

- Set viewport meta for mobile (no user scaling)
- Use 430px max-width for large phones (iPhone Pro Max)
- Design touch targets minimum 44x44px
- Include safe-area-inset for notched devices
- Use Tailwind's mobile-first responsive prefixes (sm:, md:, lg:)
- Simulate iOS/Android styling conventions based on direction