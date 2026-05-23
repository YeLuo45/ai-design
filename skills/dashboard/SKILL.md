# Skill: Dashboard

## Overview

The **dashboard** skill creates data-rich admin panels, analytics dashboards, and monitoring interfaces. It emphasizes clear data visualization, efficient information hierarchy, and professional styling suitable for business applications.

## Output Format

- **Primary**: Standalone HTML file with embedded CSS and JavaScript
- **Charts**: Chart.js, ApexCharts, or custom SVG visualizations
- **Layout**: Sidebar navigation with main content area

## Capabilities

### Layout Components
- Sidebar navigation (collapsible)
- Top header with user menu
- Data tables with sorting and pagination
- Card grids for metrics and KPIs
- Tabbed content sections
- Breadcrumb navigation

### Data Visualization
- Line charts (time series, trends)
- Bar charts (comparisons, rankings)
- Pie/donut charts (proportions)
- Area charts (cumulative data)
- Progress bars and gauges
- Data tables with filtering

### UI Elements
- Stat cards with trend indicators
- Search and filter controls
- Date range pickers
- Dropdown menus
- Action buttons and toolbars
- Notification toasts

## Example Prompt

```
Create an analytics dashboard with:
- Sidebar navigation (Dashboard, Users, Reports, Settings)
- Top stats row with 4 metric cards
- Main chart showing daily active users over 30 days
- Recent activity table with 10 rows
- Dark mode support
- Responsive layout
```

## Output Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100">
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside>...</aside>
    <!-- Main Content -->
    <main class="flex-1">
      <!-- Header -->
      <!-- Stats Cards -->
      <!-- Charts -->
      <!-- Tables -->
    </main>
  </div>
</body>
</html>
```

## Technical Notes

- Include Chart.js CDN for data visualization
- Use Tailwind CSS for layout and styling
- Implement responsive breakpoints (mobile, tablet, desktop)
- Support dark mode via CSS variables or Tailwind dark: modifier
- Follow dashboard design best practices (whitespace, hierarchy)