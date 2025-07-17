# API Documentation
## Mind Hillmetric REST API v1.0

### Base URL
```
Production: https://api.mindhill.com/v1
Staging: https://api-staging.mindhill.com/v1
Development: http://localhost:3000/api
```

### Authentication

#### Get Access Token
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600,
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response 200:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

### Headers Required for All Requests
```http
Authorization: Bearer {accessToken}
X-Request-ID: {unique-request-id}
Content-Type: application/json
```

---

## Workflows API

### List Workflows
```http
GET /workflows?page=1&limit=20&status=active&search=finance

Response 200:
{
  "data": [
    {
      "id": 1,
      "name": "Financial Data Processing",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "last_run": "2024-01-20T15:45:00Z",
      "total_runs": 245,
      "success_rate": 98.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Get Single Workflow
```http
GET /workflows/1

Response 200:
{
  "id": 1,
  "name": "Financial Data Processing",
  "description": "Processes daily financial reports",
  "status": "active",
  "configuration": {
    "schedule": "0 2 * * *",
    "timezone": "UTC",
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2
    }
  },
  "stages": [
    {
      "id": 1,
      "type": "fetching",
      "name": "Data Collection",
      "order": 1
    },
    {
      "id": 2,
      "type": "processing",
      "name": "Data Processing",
      "order": 2
    }
  ]
}
```

### Create Workflow
```http
POST /workflows
Content-Type: application/json

{
  "name": "New Financial Workflow",
  "description": "Process quarterly reports",
  "configuration": {
    "schedule": "0 0 1 */3 *",
    "timezone": "America/New_York"
  }
}

Response 201:
{
  "id": 157,
  "name": "New Financial Workflow",
  "status": "inactive",
  "created_at": "2024-01-21T10:00:00Z"
}
```

### Update Workflow
```http
PATCH /workflows/157
Content-Type: application/json

{
  "status": "active",
  "configuration": {
    "schedule": "0 0 1 * *"
  }
}

Response 200:
{
  "id": 157,
  "status": "active",
  "updated_at": "2024-01-21T10:05:00Z"
}
```

### Delete Workflow
```http
DELETE /workflows/157

Response 204: No Content
```

---

## Workflow Execution API

### Get Execution History
```http
GET /workflow-execution-log?workflowId=1&status=Success&dateFrom=2024-01-01&dateTo=2024-01-31

Response 200:
{
  "data": [
    {
      "id": 12345,
      "workflow_id": 1,
      "workflow_name": "Financial Data Processing",
      "run_number": 245,
      "status": "Success",
      "started_at": "2024-01-20T02:00:00Z",
      "completed_at": "2024-01-20T02:35:00Z",
      "duration_minutes": 35,
      "stages_completed": 5,
      "content_processed": 1250
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 245
  }
}
```

### Get Execution Details
```http
GET /workflow-execution-log/12345

Response 200:
{
  "id": 12345,
  "workflow_id": 1,
  "stages": [
    {
      "stage_id": 1,
      "stage_name": "Fetching",
      "status": "Success",
      "started_at": "2024-01-20T02:00:00Z",
      "completed_at": "2024-01-20T02:10:00Z",
      "items_processed": 250,
      "errors": []
    },
    {
      "stage_id": 2,
      "stage_name": "Processing",
      "status": "Success",
      "started_at": "2024-01-20T02:10:00Z",
      "completed_at": "2024-01-20T02:25:00Z",
      "items_processed": 250,
      "errors": []
    }
  ]
}
```

---

## Fetching History API

### List Fetching Records
```http
GET /fetching-history?status=Success&pageSize=50

Response 200:
{
  "data": [
    {
      "fetchingID": 98765,
      "fluxID": 1,
      "status": "Success",
      "timestamp": "2024-01-20T02:00:00Z",
      "completedAt": "2024-01-20T02:10:00Z",
      "numberOfContent": 250,
      "fetchingTimeInSeconds": 600,
      "dataSourceUrl": "https://source.example.com/data"
    }
  ],
  "meta": {
    "total": 1250,
    "page": 1,
    "pageSize": 50
  }
}
```

### Get Fetching Details
```http
GET /fetching-history/98765

Response 200:
{
  "fetchingID": 98765,
  "fluxID": 1,
  "status": "Success",
  "contentsFetched": [
    {
      "contentID": 1001,
      "fileName": "report_2024_01.pdf",
      "fileSize": 2048576,
      "contentType": "application/pdf",
      "fetchedAt": "2024-01-20T02:05:00Z"
    }
  ]
}
```

---

## Processing History API

### List Processing Records
```http
GET /processing-history?status=Success&durationBucket=5-15min

Response 200:
{
  "data": [
    {
      "processingID": 54321,
      "fetchingID": 98765,
      "fluxID": 1,
      "status": "Success",
      "timestamp": "2024-01-20T02:10:00Z",
      "completedAt": "2024-01-20T02:25:00Z",
      "processingTimeInSeconds": 900,
      "numberOfProcessingContent": 250
    }
  ]
}
```

---

## Content API

### List Fetched Contents
```http
GET /fetched-contents?fetchingId=98765&contentType=pdf

Response 200:
{
  "data": [
    {
      "contentID": 1001,
      "fetchingID": 98765,
      "fluxID": 1,
      "contentName": "report_2024_01.pdf",
      "contentType": "application/pdf",
      "fileSize": 2048576,
      "status": "processed",
      "createdAt": "2024-01-20T02:05:00Z",
      "processedAt": "2024-01-20T02:20:00Z"
    }
  ]
}
```

### Download Content
```http
GET /fetched-contents/1001/download

Response 200:
Content-Type: application/pdf
Content-Disposition: attachment; filename="report_2024_01.pdf"

[Binary content]
```

### Get Content Preview
```http
GET /fetched-contents/1001/preview

Response 200:
{
  "contentID": 1001,
  "preview": {
    "type": "pdf",
    "pages": 25,
    "thumbnailUrl": "https://cdn.mindhill.com/previews/1001_thumb.jpg",
    "extractedText": "First 500 characters of text..."
  }
}
```

---

## Reports API

### List Reports (Flux)
```http
GET /reports?category=financial&status=active

Response 200:
{
  "data": [
    {
      "id": 1,
      "name": "Q4 Financial Report",
      "category": "financial",
      "status": "active",
      "lastUpdated": "2024-01-20T15:00:00Z",
      "totalRuns": 45,
      "successRate": 97.8
    }
  ]
}
```

### Update Report
```http
PUT /reports/1
Content-Type: application/json

{
  "name": "Q4 Financial Report Updated",
  "configuration": {
    "emailNotifications": ["admin@example.com"],
    "retentionDays": 90
  }
}

Response 200:
{
  "id": 1,
  "name": "Q4 Financial Report Updated",
  "updated_at": "2024-01-21T10:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Name is required",
      "schedule": "Invalid cron expression"
    }
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Workflow with ID 999 not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "retryAfter": 60
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_abc123"
  }
}
```

---

## Rate Limiting

- **Authenticated requests**: 1000 per hour
- **Unauthenticated requests**: 100 per hour
- **File uploads**: 100 per day
- **Large data exports**: 10 per hour

Headers returned:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642444800
```

---

## Pagination

All list endpoints support pagination:

```http
GET /workflows?page=2&limit=50

Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
```

---

## Filtering and Sorting

### Filtering
```http
GET /workflows?status=active&category=financial&createdAfter=2024-01-01
```

### Sorting
```http
GET /workflows?sort=name:asc,created_at:desc
```

### Search
```http
GET /workflows?search=finance&searchFields=name,description
```

---

## Webhooks

### Register Webhook
```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://yourapp.com/webhook",
  "events": ["workflow.completed", "workflow.failed"],
  "secret": "your-webhook-secret"
}

Response 201:
{
  "id": "webhook_123",
  "url": "https://yourapp.com/webhook",
  "events": ["workflow.completed", "workflow.failed"],
  "active": true
}
```

### Webhook Payload Example
```json
{
  "event": "workflow.completed",
  "timestamp": "2024-01-20T02:35:00Z",
  "data": {
    "workflowId": 1,
    "executionId": 12345,
    "status": "Success",
    "duration": 2100
  }
}
```

### Webhook Signature Verification
```
X-Webhook-Signature: sha256=a1b2c3d4e5f6...
```

---

## API Versioning

- Version included in URL: `/v1/`, `/v2/`
- Deprecation notice: 6 months
- Sunset period: 12 months
- Version header: `X-API-Version: 1.0`

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { MindHillClient } from '@mindhill/sdk';

const client = new MindHillClient({
  apiKey: process.env.MINDHILL_API_KEY,
  environment: 'production'
});

// Get workflows
const workflows = await client.workflows.list({
  status: 'active',
  page: 1,
  limit: 20
});

// Create workflow
const newWorkflow = await client.workflows.create({
  name: 'New Workflow',
  configuration: {
    schedule: '0 0 * * *'
  }
});
```

### Python
```python
from mindhill import MindHillClient

client = MindHillClient(
    api_key=os.environ['MINDHILL_API_KEY'],
    environment='production'
)

# Get workflows
workflows = client.workflows.list(
    status='active',
    page=1,
    limit=20
)

# Create workflow
new_workflow = client.workflows.create(
    name='New Workflow',
    configuration={
        'schedule': '0 0 * * *'
    }
)
```

---

## Testing Endpoints

### Health Check
```http
GET /health

Response 200:
{
  "status": "healthy",
  "timestamp": "2024-01-21T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

### API Status
```http
GET /status

Response 200:
{
  "version": "1.0.0",
  "uptime": 864000,
  "requests_served": 1234567
}
```