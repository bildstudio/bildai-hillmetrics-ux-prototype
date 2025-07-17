# Development Workflow Guide
## Mind Hillmetric Application

### Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Git Workflow](#git-workflow)
3. [Code Style and Standards](#code-style-and-standards)
4. [Testing Workflow](#testing-workflow)
5. [Code Review Process](#code-review-process)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Issue Management](#issue-management)
8. [Documentation Standards](#documentation-standards)
9. [Performance Guidelines](#performance-guidelines)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Development Environment Setup

### 1. Prerequisites Installation
```bash
# Node.js (v18 or higher)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 18
fnm use 18

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be v9.x.x

# Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"
git config --global init.defaultBranch main

# Optional: Set up Git aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

### 2. Project Setup
```bash
# Clone the repository
git clone https://github.com/your-org/mind-hillmetric-final.git
cd mind-hillmetric-final

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your local configuration
nano .env.local

# Start development server
npm run dev

# Verify setup - should open http://localhost:3000
open http://localhost:3000
```

### 3. Development Tools Configuration

#### VS Code Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.rulers": [100],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

#### VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "usernamehw.errorlens",
    "gruntfuggly.todo-tree"
  ]
}
```

### 4. Environment Variables Template
```bash
# .env.example
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mind_hillmetric_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-secret-for-development"
NEXTAUTH_URL="http://localhost:3000"

# API Keys (Development)
OPENAI_API_KEY="sk-dev-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-dev-your-anthropic-api-key"

# External Services
SENTRY_DSN="https://your-dev-sentry-dsn@sentry.io/project"
ANALYTICS_ID="GA-DEV-TRACKING-ID"

# Development Features
LOG_LEVEL="debug"
ENABLE_MOCK_DATA="true"
DISABLE_RATE_LIMITING="true"
```

---

## Git Workflow

### 1. Branch Naming Convention
```bash
# Feature branches
feature/user-authentication
feature/workflow-diagram-improvements
feature/performance-optimization

# Bug fix branches
fix/badge-click-functionality
fix/memory-leak-in-grid
fix/typo-in-error-message

# Hotfix branches (for production issues)
hotfix/critical-security-patch
hotfix/payment-gateway-issue

# Release branches
release/v1.2.0
release/v2.0.0-beta

# Chore branches (maintenance, refactoring)
chore/update-dependencies
chore/refactor-api-client
chore/improve-type-definitions
```

### 2. Standard Git Workflow
```bash
# 1. Start new feature
git checkout main
git pull origin main
git checkout -b feature/new-awesome-feature

# 2. Make changes and commit regularly
git add .
git commit -m "feat: add user profile component

- Create ProfileCard component with avatar display
- Add profile editing functionality
- Implement form validation
- Add unit tests for profile components"

# 3. Push branch and create PR
git push -u origin feature/new-awesome-feature

# 4. After PR approval, clean up
git checkout main
git pull origin main
git branch -d feature/new-awesome-feature
```

### 3. Commit Message Convention
```bash
# Format: <type>(<scope>): <description>
#
# <body>
#
# <footer>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, etc.)
refactor: # Code refactoring
perf:     # Performance improvements
test:     # Adding or updating tests
chore:    # Maintenance tasks
ci:       # CI/CD changes

# Examples:
git commit -m "feat(auth): implement OAuth2 login flow

Add Google and GitHub OAuth2 providers with proper error handling
and redirect functionality. Includes session management and user
profile synchronization.

Closes #123"

git commit -m "fix(grid): resolve badge click event propagation

Prevent workflow run badge clicks from triggering parent card
navigation. Add proper event.stopPropagation() handling.

Fixes #456"

git commit -m "perf(grid): optimize data rendering with virtualization

Implement react-window for large datasets, reducing render time
from 2.3s to 180ms for 1000+ rows.

Performance improvement: 92% faster rendering"
```

### 4. Git Hooks Setup
```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Add commit-msg hook for commit message validation
npx husky add .husky/commit-msg 'npx commitlint --edit "$1"'
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```js
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci']
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

---

## Code Style and Standards

### 1. TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

### 3. Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 4. Component Structure Standards
```typescript
// components/example/ExampleComponent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
// Third-party imports
import { Button } from '@/components/ui/button';
// Local imports
import { useExampleHook } from '@/hooks/useExample';
import { ExampleService } from '@/lib/services/exampleService';
// Types
import type { ExampleProps, ExampleData } from '@/types/example';

interface Props extends ExampleProps {
  className?: string;
  onAction?: (data: ExampleData) => void;
}

/**
 * ExampleComponent displays example data with interactive functionality
 * 
 * @param props - Component props
 * @returns JSX element
 */
export function ExampleComponent({ 
  className, 
  onAction, 
  initialData,
  ...rest 
}: Props) {
  // State declarations
  const [data, setData] = useState<ExampleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custom hooks
  const { processData, isProcessing } = useExampleHook();

  // Effects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await ExampleService.getData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Event handlers
  const handleAction = (item: ExampleData) => {
    onAction?.(item);
  };

  const handleProcess = async () => {
    try {
      const processed = await processData(data);
      setData(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  // Early returns
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  // Render
  return (
    <div className={clsx('example-component', className)} {...rest}>
      <div className="header">
        <h2>Example Component</h2>
        <Button onClick={handleProcess} disabled={isProcessing}>
          Process Data
        </Button>
      </div>
      
      <div className="content">
        {data.map(item => (
          <div key={item.id} onClick={() => handleAction(item)}>
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. File Organization Standards
```
src/
├── app/                      # Next.js app directory
│   ├── (app)/               # Route groups
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   └── shared/              # Shared business components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
│   ├── services/            # API services
│   ├── utils/               # Helper functions
│   └── constants/           # Application constants
├── types/                   # TypeScript type definitions
├── styles/                  # CSS and styling files
└── __tests__/              # Test files
```

---

## Testing Workflow

### 1. Test Setup and Configuration
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

```js
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### 2. Testing Standards
```typescript
// __tests__/components/ExampleComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleComponent } from '@/components/example/ExampleComponent';
import { ExampleService } from '@/lib/services/exampleService';

// Mock external dependencies
jest.mock('@/lib/services/exampleService');
const mockedExampleService = jest.mocked(ExampleService);

// Mock data
const mockData = [
  { id: '1', name: 'Test Item 1' },
  { id: '2', name: 'Test Item 2' },
];

describe('ExampleComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedExampleService.getData.mockResolvedValue(mockData);
  });

  it('renders loading state initially', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders data after successful fetch', async () => {
    render(<ExampleComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    const errorMessage = 'Failed to fetch data';
    mockedExampleService.getData.mockRejectedValue(new Error(errorMessage));

    render(<ExampleComponent />);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('calls onAction when item is clicked', async () => {
    const mockOnAction = jest.fn();
    render(<ExampleComponent onAction={mockOnAction} />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Item 1'));
    expect(mockOnAction).toHaveBeenCalledWith(mockData[0]);
  });

  it('processes data when process button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExampleComponent />);

    await waitFor(() => {
      expect(screen.getByText('Process Data')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Process Data'));
    // Assert processing behavior
  });
});
```

### 3. Test Running Scripts
```json
// package.json scripts
{
  "scripts": {
    "test": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:coverage": "jest --coverage",
    "test:update": "jest --updateSnapshot"
  }
}
```

### 4. Pre-commit Test Validation
```bash
# Run before committing
npm run test:ci
npm run lint
npm run type-check
npm run build
```

---

## Code Review Process

### 1. Pull Request Template
```markdown
<!-- .github/pull_request_template.md -->
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Screenshots (if applicable)
Add screenshots or GIFs showing the changes.

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is properly commented
- [ ] Tests added/updated for changes
- [ ] Documentation updated (if needed)
- [ ] No new console errors or warnings
- [ ] Performance impact considered
- [ ] Accessibility considerations addressed

## Related Issues
Closes #[issue_number]
```

### 2. Code Review Checklist

#### For Authors:
```markdown
### Before Creating PR:
- [ ] Branch is up to date with main
- [ ] All tests pass locally
- [ ] Code is properly formatted (Prettier)
- [ ] No linting errors (ESLint)
- [ ] TypeScript compilation successful
- [ ] Manual testing completed
- [ ] Performance impact assessed
- [ ] Documentation updated if needed

### PR Description:
- [ ] Clear description of changes
- [ ] Context and reasoning provided
- [ ] Screenshots/GIFs included for UI changes
- [ ] Breaking changes highlighted
- [ ] Migration instructions (if applicable)
```

#### For Reviewers:
```markdown
### Code Quality:
- [ ] Code is readable and well-structured
- [ ] Follows established patterns and conventions
- [ ] No code duplication or unnecessary complexity
- [ ] Error handling is appropriate
- [ ] Security considerations addressed

### Functionality:
- [ ] Changes work as described
- [ ] Edge cases are handled
- [ ] No regressions introduced
- [ ] Performance implications acceptable
- [ ] Accessibility maintained/improved

### Testing:
- [ ] Adequate test coverage
- [ ] Tests are meaningful and correct
- [ ] Manual testing scenarios covered
- [ ] No flaky or unreliable tests
```

### 3. Review Response Standards
```markdown
# Constructive feedback examples:

## Good feedback:
"Consider extracting this logic into a separate hook for reusability. For example:
```typescript
const useWorkflowData = (workflowId: string) => {
  // extracted logic here
};
```
This would make testing easier and improve code organization."

## Instead of:
"This code is messy."

## Good feedback:
"There's a potential memory leak here. The event listener is added but never removed. Consider adding cleanup in useEffect:
```typescript
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```"

## Instead of:
"This will break."
```

---

## Deployment Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Archive build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: .next/

  deploy-staging:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Staging
      run: |
        echo "Deploying to staging environment"
        # Add actual deployment commands here
        
  deploy-production:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Production
      run: |
        echo "Deploying to production environment"
        # Add actual deployment commands here
```

### 2. Environment-Specific Deployments
```bash
# Deploy to different environments
npm run deploy:dev     # Development environment
npm run deploy:staging # Staging environment
npm run deploy:prod    # Production environment

# Build for different environments
npm run build:dev
npm run build:staging
npm run build:prod
```

### 3. Deployment Checklist
```markdown
### Pre-Deployment:
- [ ] All tests passing
- [ ] Code review completed and approved
- [ ] Database migrations ready (if applicable)
- [ ] Environment variables updated
- [ ] Feature flags configured
- [ ] Performance testing completed
- [ ] Security scan passed

### Deployment:
- [ ] Database migrations executed
- [ ] Application deployed successfully
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Rollback plan ready

### Post-Deployment:
- [ ] Smoke tests completed
- [ ] Key user journeys verified
- [ ] Performance metrics reviewed
- [ ] Error rates monitored
- [ ] User feedback collected
- [ ] Documentation updated
```

---

## Issue Management

### 1. Issue Templates
```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- Browser: [e.g. Chrome 91, Safari 14]
- Device: [e.g. Desktop, iPhone 12]
- OS: [e.g. macOS 11.4, Windows 10]
- Version: [e.g. 1.2.3]

## Additional Context
Add any other context about the problem here.
```

### 2. Priority and Severity Labels
```yaml
# Labels for issue management
Priority:
  - priority/critical  # System down, data loss, security breach
  - priority/high      # Major functionality broken
  - priority/medium    # Important features affected
  - priority/low       # Minor issues, enhancements

Type:
  - type/bug          # Something is broken
  - type/feature      # New functionality
  - type/enhancement  # Improvement to existing feature
  - type/documentation # Documentation changes
  - type/performance  # Performance improvements

Status:
  - status/triage     # Needs investigation
  - status/blocked    # Blocked by external dependencies
  - status/in-progress # Currently being worked on
  - status/ready      # Ready for development
  - status/review     # In code review
```

### 3. Sprint Planning Process
```markdown
### Weekly Sprint Planning:
1. **Monday**: Sprint planning meeting
   - Review completed work from previous sprint
   - Prioritize backlog items
   - Assign story points
   - Commit to sprint goals

2. **Tuesday-Thursday**: Development work
   - Daily standups at 9:00 AM
   - Continuous integration and deployment
   - Code reviews and pair programming

3. **Friday**: Sprint review and retrospective
   - Demo completed features
   - Gather feedback
   - Identify improvements for next sprint
   - Update project roadmap
```

---

## Documentation Standards

### 1. Code Documentation
```typescript
/**
 * Processes workflow execution data and generates performance metrics
 * 
 * @param workflowData - Array of workflow execution records
 * @param timeRange - Time range for metric calculation
 * @returns Object containing calculated performance metrics
 * 
 * @example
 * ```typescript
 * const metrics = calculateWorkflowMetrics(
 *   executionData,
 *   { start: '2024-01-01', end: '2024-01-31' }
 * );
 * console.log(metrics.averageExecutionTime); // 1250ms
 * ```
 * 
 * @throws {ValidationError} When workflowData is empty or invalid
 * @throws {DateRangeError} When timeRange is invalid
 */
export async function calculateWorkflowMetrics(
  workflowData: WorkflowExecution[],
  timeRange: TimeRange
): Promise<WorkflowMetrics> {
  // Implementation
}
```

### 2. README Template
```markdown
# Component/Feature Name

## Overview
Brief description of what this component/feature does.

## Usage
```typescript
import { ComponentName } from '@/components/ComponentName';

function MyComponent() {
  return (
    <ComponentName
      prop1="value1"
      prop2={value2}
      onAction={handleAction}
    />
  );
}
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description of prop1 |
| prop2 | number | 0 | Description of prop2 |
| onAction | function | - | Callback function |

## Examples
### Basic Usage
[Code example]

### Advanced Usage
[Code example]

## Testing
```bash
npm test -- ComponentName
```

## Known Issues
- List any known issues or limitations

## Contributing
Guidelines for contributing to this component.
```

### 3. API Documentation Standards
```typescript
// Always document API routes
/**
 * GET /api/workflows
 * 
 * Retrieves a paginated list of workflow executions
 * 
 * Query Parameters:
 * - page: number (default: 1) - Page number
 * - limit: number (default: 20) - Items per page
 * - status: string (optional) - Filter by status
 * - sortBy: string (default: 'createdAt') - Sort field
 * - sortOrder: 'asc' | 'desc' (default: 'desc') - Sort order
 * 
 * Response:
 * - 200: Success with workflow data
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

---

## Performance Guidelines

### 1. Performance Budget
```javascript
// Performance thresholds
const PERFORMANCE_BUDGET = {
  // Core Web Vitals
  LCP: 2500,        // Largest Contentful Paint (ms)
  FID: 100,         // First Input Delay (ms)
  CLS: 0.1,         // Cumulative Layout Shift
  
  // Additional metrics
  FCP: 1800,        // First Contentful Paint (ms)
  TTI: 3800,        // Time to Interactive (ms)
  TBT: 300,         // Total Blocking Time (ms)
  
  // Bundle sizes
  MAIN_BUNDLE: 244,  // KB (gzipped)
  CHUNK_SIZE: 128,   // KB (gzipped)
  
  // API response times
  API_RESPONSE: 500, // ms
  DATABASE_QUERY: 100, // ms
};
```

### 2. Performance Monitoring
```typescript
// Performance monitoring in components
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16) { // More than one frame
          console.warn(`Slow operation in ${componentName}:`, {
            operation: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, [componentName]);
}
```

### 3. Performance Review Checklist
```markdown
### Before Code Review:
- [ ] Bundle size impact assessed
- [ ] Large dependencies justified
- [ ] Images optimized and properly sized
- [ ] Lazy loading implemented where appropriate
- [ ] Unnecessary re-renders eliminated
- [ ] Database queries optimized
- [ ] Caching strategy implemented

### Performance Testing:
- [ ] Lighthouse scores reviewed
- [ ] Core Web Vitals measured
- [ ] Network throttling tested
- [ ] Large dataset performance verified
- [ ] Memory usage profiled
- [ ] CPU usage measured
```

---

## Troubleshooting Guide

### 1. Common Development Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Fix ESLint issues
npm run lint -- --fix
```

#### Runtime Errors
```bash
# Check browser console for errors
# Open DevTools (F12) → Console tab

# Check server logs
npm run dev
# Look for error messages in terminal

# Enable debug logging
DEBUG=* npm run dev
```

#### Performance Issues
```bash
# Analyze bundle size
npm run build
npm run analyze

# Profile React components
# Use React DevTools Profiler tab

# Check memory usage
# Use browser DevTools Memory tab
```

### 2. Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "CI": "true"
      }
    }
  ]
}
```

### 3. Environment Troubleshooting
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Verify environment variables
npm run env:check

# Check port availability
lsof -i :3000

# Clear all caches
npm run clean:all
```

### 4. Git Troubleshooting
```bash
# Reset local changes
git stash
git checkout main
git pull origin main

# Fix merge conflicts
git status
# Edit conflicted files
git add .
git commit -m "resolve merge conflicts"

# Revert last commit
git reset --soft HEAD~1

# Force push (use with caution)
git push --force-with-lease origin feature-branch
```

This comprehensive development workflow guide provides concrete processes, tools, and standards that ensure consistent, high-quality development practices across the Mind Hillmetric project.