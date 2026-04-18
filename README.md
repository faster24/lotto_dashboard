# Lotto Dashboard

A comprehensive lottery management dashboard built with React, TypeScript, and Material-UI. This application provides tools for managing lottery bets, users, analytics, and various lottery game results (2D, 3D).

## Features

- **Authentication**: Secure login system with role-based access control
- **Bet Management**: Create, view, and manage lottery bets
- **User Management**: Admin panel for managing user accounts
- **Analytics & Statistics**: Comprehensive data visualization with charts and reports
- **Lottery Results**: 
  - 2D Results management
  - 3D Results management
- **Settings**: Configurable odds, bank settings, and system preferences
- **Payout Queue**: Manage payout processing

## Tech Stack

- **Frontend Framework**: React 19.2.4
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 8.0.1
- **UI Library**: Material-UI (MUI) 7.3.9
- **State Management**: Zustand 5.0.12
- **Routing**: React Router DOM 7.13.1
- **Charts**: Recharts 3.8.0
- **Styling**: Emotion (React & Styled)
- **Testing**: Vitest 4.1.0, Testing Library

## Project Structure

```
src/
├── api/                 # API integration modules
│   ├── authApi.ts
│   ├── betsApi.ts
│   ├── usersApi.ts
│   ├── analyticsApi.ts
│   ├── twoDResultsApi.ts
│   ├── threeDResultsApi.ts
│   ├── adminBankSettingsApi.ts
│   └── oddSettingsApi.ts
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── BetsPage.tsx
│   ├── BetDetailPage.tsx
│   ├── UsersPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── StatsPage.tsx
│   ├── TwoDResultsPage.tsx
│   ├── ThreeDResultsPage.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── stores/             # Zustand state stores
│   ├── authStore.ts
│   ├── uiStore.ts
│   ├── analyticsStore.ts
│   └── dataStore.ts
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
├── providers/          # React context providers
└── assets/             # Static assets
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Build

Create a production build:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting

Run ESLint:

```bash
npm run lint
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Configuration

### TypeScript

TypeScript configuration is split into multiple files:
- `tsconfig.json` - Root configuration
- `tsconfig.app.json` - Application-specific configuration
- `tsconfig.node.json` - Node/Vite configuration

### ESLint

The project uses ESLint with TypeScript support. For production applications, consider enabling type-aware lint rules (see the original template documentation for details).

## API Integration

The application integrates with various backend services through the `src/api/` module. Each API module handles specific functionality:

- Authentication
- Bet operations
- User management
- Analytics data
- Lottery results (2D/3D)
- Bank and odds settings

## State Management

State is managed using Zustand stores located in `src/stores/`:

- **authStore**: Authentication state and actions
- **uiStore**: UI state (theme, sidebar, modals, etc.)
- **analyticsStore**: Analytics data state
- **dataStore**: General application data

## Pages Overview

- **Login**: User authentication
- **Dashboard**: Main overview (if implemented)
- **Bets**: List and manage all bets
- **Bet Detail**: View individual bet details
- **Users**: User management (admin)
- **Analytics**: Data analytics and reports
- **Stats**: Statistical information
- **2D Results**: Two-digit lottery results
- **3D Results**: Three-digit lottery results
- **Settings**: System settings
- **Odds Settings**: Configure betting odds
- **Bank Settings**: Banking configuration (admin)
- **Payout Queue**: Manage payouts
- **Manage Account**: User account management

## License

Private project - All rights reserved.

## Contributing

This is a private project. Please contact the maintainers for contribution guidelines.
