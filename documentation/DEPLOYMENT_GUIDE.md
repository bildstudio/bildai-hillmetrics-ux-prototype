# Deployment Guide
## Mind Hillmetric Production Deployment

### Overview
Complete step-by-step deployment guide for Mind Hillmetric application with production-ready configurations, monitoring, and scaling strategies.

---

## Prerequisites

### System Requirements
- **Node.js**: 18.17.0 or higher
- **Database**: PostgreSQL 14+ or MySQL 8+
- **Cache**: Redis 6.2+
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB SSD
- **Network**: Static IP address and domain name

### Required Accounts & Services
- [ ] Cloud provider account (AWS/GCP/Azure)
- [ ] Domain registrar access
- [ ] SSL certificate provider
- [ ] Email service (SendGrid/AWS SES)
- [ ] Monitoring service (Sentry/DataDog)
- [ ] Container registry (Docker Hub/AWS ECR)

---

## Local Development Setup

### 1. Clone and Install
```bash
# Clone repository
git clone https://github.com/your-org/mind-hillmetric.git
cd mind-hillmetric

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Environment Configuration
```bash
# .env.local
NODE_ENV=development
DATABASE_URL="postgresql://localhost:5432/mindhill_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-dev-jwt-secret-32-chars-min"
JWT_REFRESH_SECRET="your-dev-refresh-secret-32-chars"
ENCRYPTION_KEY="your-dev-encryption-key-32-chars"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-dev-nextauth-secret"
```

### 3. Database Setup
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb mindhill_dev

# Run migrations
npx prisma migrate dev
npx prisma generate

# Seed database
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```

---

## Docker Development

### Docker Compose Setup
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/mindhill_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: mindhill_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### Run Development Environment
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

---

## Production Build

### 1. Production Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Build and Test
```bash
# Build production image
docker build -t mindhill:latest .

# Test production build
docker run -p 3000:3000 --env-file .env.production mindhill:latest
```

### 3. Next.js Configuration for Production
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  images: {
    domains: ['cdn.mindhill.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
```

---

## Cloud Deployment

### AWS Deployment

#### 1. AWS Infrastructure Setup
```yaml
# aws-infrastructure.yml (CloudFormation)
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Mind Hillmetric Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [staging, production]

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub mindhill-vpc-${Environment}

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub mindhill-igw-${Environment}

  # Attach IGW to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub mindhill-public-subnet-1-${Environment}

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub mindhill-public-subnet-2-${Environment}

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub mindhill-private-subnet-1-${Environment}

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub mindhill-private-subnet-2-${Environment}

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub mindhill-db-subnet-group-${Environment}

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  ECSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for ECS tasks
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref ECSSecurityGroup

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub mindhill-db-${Environment}
      DBName: mindhill
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '14.9'
      MasterUsername: postgres
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      BackupRetentionPeriod: 7
      MultiAZ: !If [IsProduction, true, false]
      DeletionProtection: !If [IsProduction, true, false]

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub mindhill-cluster-${Environment}
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub mindhill-alb-${Environment}
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Parameters:
  DatabasePassword:
    Type: String
    NoEcho: true
    Description: Password for the RDS database
    MinLength: 8

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${AWS::StackName}-VPC-ID

  DatabaseEndpoint:
    Description: RDS instance endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub ${AWS::StackName}-DB-ENDPOINT
```

#### 2. ECS Task Definition
```json
{
  "family": "mindhill-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "mindhill-app",
      "image": "YOUR_ECR_URI/mindhill:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/mindhill/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/mindhill/jwt-secret"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:ssm:REGION:ACCOUNT:parameter/mindhill/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mindhill-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### 3. Deploy to AWS
```bash
#!/bin/bash
# deploy-aws.sh

set -e

ENVIRONMENT=${1:-staging}
AWS_REGION=${2:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/mindhill"

echo "Deploying to $ENVIRONMENT environment..."

# 1. Build and push Docker image
echo "Building Docker image..."
docker build -t mindhill:latest .

echo "Pushing to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker tag mindhill:latest $ECR_REPOSITORY:latest
docker tag mindhill:latest $ECR_REPOSITORY:$ENVIRONMENT-$(git rev-parse --short HEAD)
docker push $ECR_REPOSITORY:latest
docker push $ECR_REPOSITORY:$ENVIRONMENT-$(git rev-parse --short HEAD)

# 2. Deploy infrastructure
echo "Deploying infrastructure..."
aws cloudformation deploy \
  --template-file aws-infrastructure.yml \
  --stack-name mindhill-infrastructure-$ENVIRONMENT \
  --parameter-overrides Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION

# 3. Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster mindhill-cluster-$ENVIRONMENT \
  --service mindhill-service-$ENVIRONMENT \
  --force-new-deployment \
  --region $AWS_REGION

echo "Deployment completed!"
```

### Google Cloud Platform Deployment

#### 1. GCP Setup
```yaml
# cloudbuild.yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/mindhill:$COMMIT_SHA', '.']

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/mindhill:$COMMIT_SHA']

  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'mindhill-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/mindhill:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/mindhill:$COMMIT_SHA'
```

#### 2. Terraform Configuration for GCP
```hcl
# main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
  default     = "production"
}

# Cloud SQL Database
resource "google_sql_database_instance" "main" {
  name             = "mindhill-db-${var.environment}"
  database_version = "POSTGRES_14"
  region           = var.region
  deletion_protection = var.environment == "production"

  settings {
    tier = "db-f1-micro"
    disk_type = "PD_SSD"
    disk_size = 20
    
    backup_configuration {
      enabled = true
      start_time = "03:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.vpc.id
    }
  }
}

resource "google_sql_database" "database" {
  name     = "mindhill"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "user" {
  name     = "mindhill_user"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "mindhill-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "mindhill-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Cloud Run Service
resource "google_cloud_run_service" "main" {
  name     = "mindhill-app-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/mindhill:latest"
        
        ports {
          container_port = 3000
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "run.googleapis.com/client-name"   = "terraform"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# IAM
resource "google_cloud_run_service_iam_member" "public" {
  service = google_cloud_run_service.main.name
  location = google_cloud_run_service.main.location
  role    = "roles/run.invoker"
  member  = "allUsers"
}

# Secret Manager
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.user.name}:${var.db_password}@${google_sql_database_instance.main.private_ip_address}:5432/${google_sql_database.database.name}"
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.main.status[0].url
}

output "database_connection_name" {
  value = google_sql_database_instance.main.connection_name
}
```

---

## Domain & SSL Setup

### 1. Domain Configuration
```bash
# DNS Records (add these to your domain registrar)
# Replace YOUR_DOMAIN with your actual domain

# A Record for root domain
@ IN A YOUR_LOAD_BALANCER_IP

# CNAME for www subdomain
www IN CNAME YOUR_DOMAIN

# CNAME for api subdomain
api IN CNAME YOUR_DOMAIN

# CNAME for assets/CDN
cdn IN CNAME YOUR_CDN_DOMAIN
```

### 2. SSL Certificate Setup

#### Using Let's Encrypt with Certbot
```bash
#!/bin/bash
# setup-ssl.sh

DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

#### Nginx Configuration with SSL
```nginx
# /etc/nginx/sites-available/mindhill
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

---

## Environment Configuration

### Production Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@your-db-host:5432/mindhill_prod"
DATABASE_SSL=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-256-bits-long"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-256-bits-long"
ENCRYPTION_KEY="your-super-secure-encryption-key-256-bits"

# Session & Cache
REDIS_URL="redis://your-redis-host:6379"
SESSION_SECRET="your-super-secure-session-secret"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
FROM_EMAIL="noreply@your-domain.com"

# File Storage
S3_BUCKET="mindhill-files-prod"
S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
DATADOG_API_KEY="your-datadog-api-key"

# Features
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
LOG_LEVEL=info

# Security
CORS_ORIGINS="https://your-domain.com,https://www.your-domain.com"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Validation
```typescript
// lib/config/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)
```

---

## Database Migration & Seeding

### Production Migration Strategy
```bash
#!/bin/bash
# migrate-production.sh

set -e

echo "Starting production database migration..."

# Backup database before migration
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma db seed --preview-feature

echo "Migration completed successfully!"
```

### Database Seeding for Production
```typescript
// prisma/seed.prod.ts
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding production database...')

  // Create admin user
  const adminPassword = await hashPassword(process.env.ADMIN_PASSWORD || 'ChangeMe123!')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mindhill.com' },
    update: {},
    create: {
      email: 'admin@mindhill.com',
      displayName: 'System Administrator',
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
    },
  })

  // Create default workflow templates
  await prisma.workflowTemplate.createMany({
    data: [
      {
        name: 'Data Processing Pipeline',
        description: 'Standard data processing workflow',
        configuration: {
          stages: ['fetching', 'processing', 'normalization', 'refinement', 'calculation'],
          timeout: 3600,
          retries: 3,
        },
      },
      {
        name: 'Document Analysis',
        description: 'Document processing and analysis workflow',
        configuration: {
          stages: ['fetching', 'processing', 'analysis'],
          timeout: 1800,
          retries: 2,
        },
      },
    ],
    skipDuplicates: true,
  })

  console.log('Production seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Health Checks & Monitoring

### Health Check Endpoint
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL!)

export async function GET() {
  const startTime = Date.now()
  const checks = {
    database: false,
    redis: false,
    memory: false,
    disk: false,
  }

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  try {
    // Redis check
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }

  // Memory check
  const memUsage = process.memoryUsage()
  checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9

  // Basic disk check (simplified)
  checks.disk = true

  const responseTime = Date.now() - startTime
  const isHealthy = Object.values(checks).every(Boolean)

  const healthData = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    responseTime,
    checks,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  }

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
  })
}
```

### Docker Health Check
```dockerfile
# Add to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

---

## Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup-production.sh

set -e

BACKUP_DIR="/var/backups/mindhill"
DATE=$(date +%Y%m%d-%H%M%S)
S3_BUCKET="mindhill-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/database-$DATE.sql.gz

# File system backup (if using local storage)
echo "Creating file system backup..."
tar -czf $BACKUP_DIR/files-$DATE.tar.gz /app/uploads

# Upload to S3
echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/database-$DATE.sql.gz s3://$S3_BUCKET/database/
aws s3 cp $BACKUP_DIR/files-$DATE.tar.gz s3://$S3_BUCKET/files/

# Cleanup old local backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Recovery Procedure
```bash
#!/bin/bash
# restore-production.sh

BACKUP_DATE=${1:-latest}
S3_BUCKET="mindhill-backups"

if [ "$BACKUP_DATE" = "latest" ]; then
  # Get latest backup
  BACKUP_DATE=$(aws s3 ls s3://$S3_BUCKET/database/ | sort | tail -n 1 | awk '{print $4}' | sed 's/database-\|\.sql\.gz//g')
fi

echo "Restoring from backup: $BACKUP_DATE"

# Download backup
aws s3 cp s3://$S3_BUCKET/database/database-$BACKUP_DATE.sql.gz .

# Restore database
gunzip database-$BACKUP_DATE.sql.gz
psql $DATABASE_URL < database-$BACKUP_DATE.sql

# Run migrations to ensure schema is up to date
npx prisma migrate deploy

echo "Restore completed!"
```

---

## Deployment Checklist

### Pre-Deployment Checklist
- [ ] All environment variables are set and validated
- [ ] Database migrations are tested
- [ ] SSL certificates are configured
- [ ] Health checks are working
- [ ] Monitoring and logging are configured
- [ ] Backup strategy is implemented
- [ ] Load balancer is configured
- [ ] Security headers are set
- [ ] CDN is configured (if applicable)
- [ ] DNS records are updated

### Post-Deployment Checklist
- [ ] Application is accessible via HTTPS
- [ ] Health check endpoint returns 200
- [ ] Database connections are working
- [ ] Redis cache is operational
- [ ] Email notifications are working
- [ ] File uploads are working
- [ ] All API endpoints are responding
- [ ] Monitoring alerts are configured
- [ ] Performance metrics are being collected
- [ ] Backup process has been tested

### Rollback Plan
```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=${1:-previous}

echo "Rolling back to version: $PREVIOUS_VERSION"

# ECS rollback
aws ecs update-service \
  --cluster mindhill-cluster-production \
  --service mindhill-service-production \
  --task-definition mindhill-app:$PREVIOUS_VERSION

# Database rollback (if needed)
# psql $DATABASE_URL < rollback-migration.sql

echo "Rollback completed!"
```

---

## Scaling & Performance

### Auto Scaling Configuration
```yaml
# auto-scaling.yml (for AWS ECS)
Resources:
  AutoScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: ecs
      ResourceId: service/mindhill-cluster-production/mindhill-service-production
      ScalableDimension: ecs:service:DesiredCount
      MinCapacity: 2
      MaxCapacity: 10
      RoleARN: !Sub arn:aws:iam::${AWS::AccountId}:role/application-autoscaling-ecs-service

  ScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: CPUScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref AutoScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: ECSServiceAverageCPUUtilization
        ScaleOutCooldown: 300
        ScaleInCooldown: 300
```

### Load Testing
```bash
# Install k6 for load testing
curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1

# Load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let response = http.get('https://your-domain.com/api/health');
  check(response, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
EOF

# Run load test
./k6 run load-test.js
```

---

*This deployment guide should be customized based on your specific infrastructure requirements and updated regularly to reflect changes in your deployment process.*