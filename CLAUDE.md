# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start the development server
- `pnpm build` - Build the production application
- `pnpm start` - Run the production server
- `pnpm lint` - Run ESLint to check code quality

### Package Management
This project uses `pnpm` as the package manager. Use `pnpm install` to install dependencies.

## High-Level Architecture

### Application Structure
This is a Next.js 15 enterprise data processing platform called HillMetrics. The application follows a modular architecture with clear separation of concerns:

#### Core Technologies
- **Framework**: Next.js 15 with App Router
- **UI Components**: Radix UI primitives with custom styling via Tailwind CSS
- **Database**: Supabase (PostgreSQL) with server-side clients
- **State Management**: React Context API for auth, blade navigation, and search
- **Type Safety**: TypeScript throughout

#### Key Architectural Patterns

1. **Blade System**: A custom sliding panel navigation system
   - `components/blade/` - Core blade infrastructure
   - `lib/blade-stack-context.tsx` - Stack management for multiple blades
   - Blades are used for detailed views without losing context

2. **Data Flow Architecture**:
   - **Server Actions**: Located in `app/actions/` for data mutations
   - **API Routes**: Located in `app/api/` for data fetching
   - **Mock Data**: Currently uses JSON files in `public/data/` (to be replaced with real APIs)

3. **Component Organization**:
   - `components/ui/` - Reusable UI primitives (buttons, dialogs, etc.)
   - `components/` - Feature-specific components organized by domain
   - Each major feature has its own directory with related components

4. **Workflow Processing System**:
   The application manages financial data workflows with multiple stages:
   - Fetching → Processing → Normalization → Calculation → Refinement
   - Each stage has dedicated history views and detail blades
   - Workflow execution logs track the entire pipeline

5. **Authentication & Security**:
   - Supabase authentication via `lib/auth-context.tsx`
   - Server-side client creation in `lib/supabase-server-client.ts`
   - Protected routes handled via middleware patterns

## Key Features & Their Locations

- **Flux Management**: Core entity representing data flows (`app/(app)/list-of-fluxs/`)
- **Workflow Visualization**: ReactFlow diagrams in various `*Diagram.tsx` components
- **Activity Tracking**: Real-time activity feeds (`components/activity/`)
- **Search System**: Unified search with advanced filters (`components/search/`)
- **Grid Views**: Data tables with sorting/filtering throughout `*-grid.tsx` components

## Environment Variables
The application requires Supabase configuration:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development Tips
- The application is deployed on Vercel and synced with v0.dev
- Mock data generation should be moved out of components for performance
- Consider the blade stack when implementing new detail views
- Follow the existing pattern of server actions for data mutations