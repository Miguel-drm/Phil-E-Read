# Phil IRI Dashboard

A comprehensive reading assessment dashboard for teachers, parents, and administrators.

## Project Structure

The project is organized to support multiple dashboard types (Teacher, Parent, Admin) with a modular component architecture:

```
src/
├── components/
│   ├── layout/                 # Reusable layout components
│   │   ├── DashboardLayout.tsx # Main dashboard layout wrapper
│   │   ├── Header.tsx         # Dashboard header with search and navigation
│   │   └── Sidebar.tsx        # Navigation sidebar (supports different user types)
│   ├── dashboard/
│   │   └── teacher/           # Teacher-specific dashboard components
│   │       ├── StatsCards.tsx # Statistics cards component
│   │       ├── PerformanceChart.tsx # ECharts performance visualization
│   │       └── UpcomingSessions.tsx # Upcoming sessions widget
│   └── common/                # Shared components (future use)
├── pages/
│   └── TeacherDashboard.tsx   # Main teacher dashboard page
├── types/                     # TypeScript type definitions (future use)
├── hooks/                     # Custom React hooks (future use)
├── utils/                     # Utility functions (future use)
└── App.tsx                    # Main app component (router)
```

## Features

### Current Implementation
- **Teacher Dashboard**: Complete dashboard with statistics, performance charts, and session management
- **Responsive Design**: Mobile-friendly layout using Tailwind CSS
- **Interactive Charts**: ECharts integration for performance visualization
- **Modular Architecture**: Reusable components for future dashboard types

### Planned Features
- **Parent Dashboard**: Student progress tracking and communication
- **Admin Dashboard**: School-wide analytics and user management
- **Authentication**: User role-based access control
- **Real-time Updates**: Live data synchronization

## Dashboard Types

### Teacher Dashboard
- Student performance tracking
- Reading session management
- Assessment creation and grading
- Class list management
- Data export capabilities

### Parent Dashboard (Future)
- Child's reading progress
- Assignment tracking
- Communication with teachers
- Progress reports

### Admin Dashboard (Future)
- School-wide analytics
- Teacher management
- Student enrollment
- System settings

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **ECharts** for data visualization
- **Vite** for build tooling

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Component Architecture

The dashboard uses a modular approach where:

- **Layout Components** (`src/components/layout/`) provide the structure
- **Dashboard Components** (`src/components/dashboard/`) contain specific functionality
- **Pages** (`src/pages/`) compose components into complete views
- **App.tsx** acts as a simple router (can be extended with React Router)

This structure makes it easy to:
- Add new dashboard types (Parent, Admin)
- Reuse components across different views
- Maintain separation of concerns
- Scale the application as it grows
