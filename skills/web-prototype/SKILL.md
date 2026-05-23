# Skill: Web Prototype

## Overview

The **web-prototype** skill enables rapid creation of interactive web prototypes using modern HTML, CSS, and JavaScript frameworks. It supports responsive layouts, component-based architecture, and integration with popular CSS frameworks like Tailwind CSS.

## Design Tokens

```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

## Responsive Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| mobile | < 640px | Phones |
| tablet | 640px - 1024px | Tablets, small laptops |
| desktop | 1024px - 1280px | Standard desktops |
| wide | > 1280px | Large displays |

## Component Library

### Button
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
```

### Card
```html
<div class="card">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
  <div class="card-footer">Footer</div>
</div>
```

### Input
```html
<input type="text" class="input" placeholder="Enter text">
<input type="email" class="input input-error" value="invalid">
<textarea class="input" rows="3"></textarea>
```

### Modal
```html
<div class="modal" id="myModal">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h3>Title</h3>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">Content</div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Navigation
```html
<nav class="navbar">
  <div class="navbar-brand">Logo</div>
  <ul class="navbar-menu">
    <li><a href="#" class="active">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>
```

## Example Prompt

```
Create a landing page for a SaaS product with:
- Hero section with headline and CTA button
- Features grid with 6 items
- Pricing section with 3 tiers
- Testimonials carousel
- Footer with links and social icons
- Mobile responsive design
- Dark mode support
```

## Output Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { /* design tokens */ }
    @media (prefers-color-scheme: dark) { /* dark mode */ }
  </style>
</head>
<body>
  <!-- Semantic HTML structure -->
  <!-- Interactive components with JavaScript -->
</body>
</html>
```

## Technical Notes

- All prototypes are self-contained single HTML files
- Use Tailwind CSS CDN for rapid styling
- Include placeholder images via Unsplash or similar
- Ensure WCAG 2.1 accessibility compliance
- Optimize for cross-browser compatibility