# Frontend Architecture Plan for HillMetrics

## 📋 Overview

This document outlines the architecture for creating a public-facing frontend application that complements the existing HillMetrics admin panel.

## 🎯 Goals

1. **User-facing application** for data consumers (not admins)
2. **Shared codebase** for common components and logic
3. **Independent deployment** of admin and frontend
4. **Optimized performance** for public users
5. **SEO-friendly** for public content

## 🏗️ Recommended Architecture: Monorepo with Turborepo

### Directory Structure
```
mind-hillmetric/
├── apps/
│   ├── admin/                 # Current admin panel (move current code here)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   ├── web/                   # New public frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── mobile/                # Future React Native app
│
├── packages/
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── chart/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── flux.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── src/
│   │   │   ├── date.ts
│   │   │   ├── format.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── api-client/            # Shared API client
│   │   ├── src/
│   │   │   ├── flux-api.ts
│   │   │   ├── auth-api.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                # Shared configurations
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── .github/
│   └── workflows/             # CI/CD for monorepo
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # PNPM workspace config
└── README.md
```

## 🚀 Implementation Steps

### Step 1: Setup Monorepo (Week 1)

```bash
# 1. Create new monorepo structure
mkdir mind-hillmetric && cd mind-hillmetric
pnpm init

# 2. Install Turborepo
pnpm add -D turbo

# 3. Create workspace configuration
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

### Step 2: Migrate Admin Panel (Week 2)

1. Move current code to `apps/admin/`
2. Update import paths
3. Extract shared components to `packages/ui/`
4. Extract types to `packages/types/`
5. Test everything works

### Step 3: Create Frontend App (Weeks 3-4)

**Key Features for Public Frontend:**

1. **Public Dashboard**
   - Read-only flux data
   - Public metrics
   - Trend visualizations
   - Export capabilities

2. **Authentication**
   - Separate auth for public users
   - Role-based access (viewer, analyst, etc.)
   - Social login options
   - Magic link authentication

3. **Data Views**
   - Simplified grids
   - Interactive charts
   - Report generation
   - Data export (CSV, PDF)

4. **SEO & Performance**
   - Static generation for public pages
   - Dynamic OG images
   - Sitemap generation
   - PWA capabilities

## 📁 Frontend App Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (public)/
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/
│   │   └── features/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── reports/
│   │   ├── analytics/
│   │   └── export/
│   └── api/
│       └── export/
├── components/
│   ├── dashboard/
│   ├── charts/
│   └── reports/
├── lib/
│   ├── auth/
│   └── api/
└── public/
```

## 🛠️ Technology Stack

### Frontend (apps/web)
- **Framework**: Next.js 15 (same as admin)
- **UI**: Tailwind CSS + Radix UI (from packages/ui)
- **Charts**: Recharts or Chart.js (lighter than admin)
- **State**: Zustand (simpler than Context)
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js or Supabase Auth

### Shared Packages
- **UI Components**: Storybook for documentation
- **API Client**: Fully typed with TypeScript
- **Utils**: Date formatting, validation, etc.

## 🎨 UI/UX Differences

### Admin Panel
- Complex workflows
- Full CRUD operations
- Advanced filtering
- Multi-level navigation
- Dense information

### Public Frontend
- Simplified navigation
- Read-only by default
- Focus on visualization
- Mobile-first design
- Faster load times

## 🔧 Development Workflow

```bash
# Run both apps in development
pnpm dev

# Run only frontend
pnpm dev --filter=web

# Build all apps
pnpm build

# Run tests
pnpm test

# Add dependency to frontend
pnpm add axios --filter=web

# Add shared UI component
pnpm add @hillmetric/ui --filter=web
```

## 📦 Deployment Strategy

### Vercel (Recommended)
```json
// vercel.json for monorepo
{
  "projects": {
    "admin": {
      "root": "apps/admin"
    },
    "web": {
      "root": "apps/web"
    }
  }
}
```

### Environment Variables
```
# Admin (.env.admin)
NEXT_PUBLIC_APP_URL=https://admin.hillmetric.com
NEXT_PUBLIC_API_URL=https://api.hillmetric.com
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Frontend (.env.web)
NEXT_PUBLIC_APP_URL=https://app.hillmetric.com
NEXT_PUBLIC_API_URL=https://api.hillmetric.com
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## 🔐 API Strategy

### Option 1: Direct Supabase (Current)
- Frontend uses Supabase client with RLS
- Admin uses service role
- Shared types from packages

### Option 2: API Gateway (Future)
```
apps/api/                      # Dedicated API app
├── src/
│   ├── routes/
│   ├── middleware/
│   └── services/
└── package.json
```

## 📊 Example Shared Components

### packages/ui/src/chart/TrendChart.tsx
```typescript
export interface TrendChartProps {
  data: TrendData[]
  height?: number
  showLegend?: boolean
  interactive?: boolean
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  height = 400,
  showLegend = true,
  interactive = true
}) => {
  // Shared chart implementation
}
```

### packages/types/src/flux.ts
```typescript
export interface Flux {
  id: string
  name: string
  status: FluxStatus
  createdAt: Date
  // ... shared type definitions
}
```

## 🚦 Migration Checklist

- [ ] Setup monorepo structure
- [ ] Install Turborepo and configure
- [ ] Move admin to apps/admin
- [ ] Extract shared UI components
- [ ] Extract shared types
- [ ] Create apps/web structure
- [ ] Setup shared ESLint config
- [ ] Setup shared TypeScript config
- [ ] Configure CI/CD for monorepo
- [ ] Update deployment scripts
- [ ] Create Storybook for UI package
- [ ] Document component usage
- [ ] Setup E2E tests for both apps
- [ ] Configure preview deployments

## 📈 Benefits of This Approach

1. **Code Reusability**: Share 40-60% of code
2. **Consistent UX**: Same components, different layouts
3. **Independent Scaling**: Deploy and scale separately
4. **Team Efficiency**: Work on both apps simultaneously
5. **Type Safety**: Shared types across all apps
6. **Maintainability**: Update once, reflect everywhere

## 🎯 Next Steps

1. **Week 1**: Setup monorepo and migrate admin
2. **Week 2**: Extract shared packages
3. **Week 3-4**: Build MVP frontend
4. **Week 5**: Testing and optimization
5. **Week 6**: Deployment and documentation

This architecture will provide a solid foundation for scaling HillMetrics to serve both administrators and end-users effectively.