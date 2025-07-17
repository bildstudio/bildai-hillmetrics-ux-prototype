# Security Guide
## Mind Hillmetric Application Security Implementation

### Overview
Complete security implementation guide with ready-to-use configurations, code examples, and step-by-step setup instructions.

---

## Authentication System

### JWT Implementation

#### JWT Configuration
```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  iat: number
  exp: number
}

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256' as const
}

export function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    algorithm: JWT_CONFIG.algorithm
  })
  
  const refreshToken = jwt.sign(payload, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    algorithm: JWT_CONFIG.algorithm
  })
  
  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_CONFIG.secret) as JWTPayload
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_CONFIG.refreshSecret) as JWTPayload
}
```

#### Authentication Middleware
```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    )
  }
  
  try {
    const payload = verifyAccessToken(token)
    
    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    )
  }
}
```

### Password Security

#### Password Hashing
```typescript
// lib/auth/password.ts
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export const PASSWORD_CONFIG = {
  saltRounds: 12,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(PASSWORD_CONFIG.saltRounds)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters`)
  }
  
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return { valid: errors.length === 0, errors }
}

export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const bytes = randomBytes(length)
  return Array.from(bytes, byte => charset[byte % charset.length]).join('')
}
```

### Two-Factor Authentication (2FA)

#### TOTP Implementation
```typescript
// lib/auth/totp.ts
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

export async function generate2FASecret(userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: `Mind Hillmetric (${userEmail})`,
    issuer: 'Mind Hillmetric',
    length: 32
  })
  
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)
  
  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    backupCodes: generateBackupCodes()
  }
}

export function verify2FAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  })
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => 
    randomBytes(4).toString('hex').toUpperCase()
  )
}

// Database schema for 2FA
/*
CREATE TABLE user_2fa (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT[], -- Array of backup codes
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP
);
*/
```

---

## Authorization & Permissions

### Role-Based Access Control (RBAC)

#### Permission System
```typescript
// lib/auth/permissions.ts
export enum Permission {
  // Workflow permissions
  WORKFLOW_VIEW = 'workflow:view',
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_EDIT = 'workflow:edit',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  
  // Data permissions
  DATA_VIEW = 'data:view',
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  DATA_DELETE = 'data:delete',
  
  // Admin permissions
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
  AUDIT_VIEW = 'audit:view'
}

export const ROLE_PERMISSIONS = {
  admin: [
    Permission.WORKFLOW_VIEW,
    Permission.WORKFLOW_CREATE,
    Permission.WORKFLOW_EDIT,
    Permission.WORKFLOW_DELETE,
    Permission.WORKFLOW_EXECUTE,
    Permission.DATA_VIEW,
    Permission.DATA_EXPORT,
    Permission.DATA_IMPORT,
    Permission.DATA_DELETE,
    Permission.USER_MANAGE,
    Permission.SYSTEM_CONFIG,
    Permission.AUDIT_VIEW
  ],
  user: [
    Permission.WORKFLOW_VIEW,
    Permission.WORKFLOW_CREATE,
    Permission.WORKFLOW_EDIT,
    Permission.WORKFLOW_EXECUTE,
    Permission.DATA_VIEW,
    Permission.DATA_EXPORT
  ],
  viewer: [
    Permission.WORKFLOW_VIEW,
    Permission.DATA_VIEW
  ]
} as const

export function hasPermission(userRole: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]?.includes(permission) || false
}

export function requirePermission(permission: Permission) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args: any[]) {
      const userRole = this.getUserRole() // Implementation depends on your context
      
      if (!hasPermission(userRole, permission)) {
        throw new Error(`Insufficient permissions: ${permission} required`)
      }
      
      return originalMethod.apply(this, args)
    }
  }
}
```

#### API Route Protection
```typescript
// lib/auth/api-protection.ts
import { NextRequest } from 'next/server'
import { verifyAccessToken } from './jwt'
import { hasPermission, Permission } from './permissions'

export function withAuth(handler: Function, requiredPermission?: Permission) {
  return async function(request: NextRequest) {
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '')
      
      if (!token) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const payload = verifyAccessToken(token)
      
      if (requiredPermission && !hasPermission(payload.role, requiredPermission)) {
        return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      
      // Add user context to request
      return handler(request, { user: payload })
    } catch (error) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }
  }
}

// Usage example
export const GET = withAuth(async (request: NextRequest, context: any) => {
  // Your protected route logic here
  return Response.json({ data: 'Protected data' })
}, Permission.DATA_VIEW)
```

---

## Data Protection

### Input Validation & Sanitization

#### Validation Schema
```typescript
// lib/validation/schemas.ts
import { z } from 'zod'

export const WorkflowCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  configuration: z.object({
    schedule: z.string()
      .regex(/^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([01]?\d|[12]\d|3[01])) (\*|([01]?\d)) (\*|[0-6])$/, 
        'Invalid cron expression'),
    timeout: z.number().min(1).max(1440),
    retries: z.number().min(0).max(10)
  })
})

export const UserUpdateSchema = z.object({
  email: z.string().email('Invalid email format'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Display name can only contain letters and spaces')
})

// SQL Injection Prevention
export function sanitizeForSQL(input: string): string {
  return input.replace(/['";\\]/g, '\\$&')
}

// XSS Prevention
export function sanitizeForHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}
```

### Encryption

#### Data Encryption
```typescript
// lib/security/encryption.ts
import crypto from 'crypto'

export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16
}

export class DataEncryption {
  private readonly key: Buffer
  
  constructor(secretKey: string) {
    this.key = crypto.scryptSync(secretKey, 'salt', ENCRYPTION_CONFIG.keyLength)
  }
  
  encrypt(text: string): string {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength)
    const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, this.key)
    cipher.setAAD(Buffer.from('additional-data'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }
  
  decrypt(encryptedText: string): string {
    const [ivHex, tagHex, encrypted] = encryptedText.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, this.key)
    decipher.setAAD(Buffer.from('additional-data'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Environment variable encryption
export const dataEncryption = new DataEncryption(process.env.ENCRYPTION_KEY!)

// Usage for sensitive data
export function encryptSensitiveData(data: any): string {
  return dataEncryption.encrypt(JSON.stringify(data))
}

export function decryptSensitiveData(encryptedData: string): any {
  return JSON.parse(dataEncryption.decrypt(encryptedData))
}
```

---

## Security Headers & CORS

### Security Headers Configuration
```typescript
// middleware/security-headers.ts
import { NextResponse } from 'next/server'

export function securityHeaders(response: NextResponse) {
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent content type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.mindhill.com",
    "frame-ancestors 'none'"
  ].join('; '))
  
  // Strict Transport Security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', '))
  
  return response
}
```

### CORS Configuration
```typescript
// lib/security/cors.ts
export const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://mindhill.com',
    'https://app.mindhill.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400 // 24 hours
}

export function setCORSHeaders(response: NextResponse, origin?: string) {
  if (origin && CORS_CONFIG.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', CORS_CONFIG.credentials.toString())
  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
  
  return response
}
```

---

## Rate Limiting & DDoS Protection

### Rate Limiting Implementation
```typescript
// lib/security/rate-limiting.ts
import { Redis } from 'ioredis'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator: (identifier: string) => string
}

export const RATE_LIMITS = {
  api: { windowMs: 60 * 1000, maxRequests: 100 },      // 100 requests per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
  upload: { windowMs: 60 * 1000, maxRequests: 10 },   // 10 uploads per minute
  export: { windowMs: 60 * 60 * 1000, maxRequests: 5 } // 5 exports per hour
}

export class RateLimiter {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }
  
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const key = config.keyGenerator(identifier)
    const now = Date.now()
    const window = Math.floor(now / config.windowMs)
    const windowKey = `${key}:${window}`
    
    const current = await this.redis.incr(windowKey)
    
    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(config.windowMs / 1000))
    }
    
    const resetTime = (window + 1) * config.windowMs
    const remaining = Math.max(0, config.maxRequests - current)
    
    return {
      allowed: current <= config.maxRequests,
      resetTime,
      remaining
    }
  }
}

// Usage in API routes
export async function withRateLimit(
  request: Request,
  identifier: string,
  limitType: keyof typeof RATE_LIMITS
) {
  const limiter = new RateLimiter()
  const config = {
    ...RATE_LIMITS[limitType],
    keyGenerator: (id: string) => `rate_limit:${limitType}:${id}`
  }
  
  const result = await limiter.checkLimit(identifier, config)
  
  if (!result.allowed) {
    return Response.json(
      { 
        error: 'Rate limit exceeded',
        resetTime: result.resetTime,
        remaining: result.remaining
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }
  
  return null // Continue processing
}
```

---

## Audit Logging

### Security Audit System
```typescript
// lib/security/audit.ts
export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export enum AuditAction {
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGE = 'auth.password.change',
  
  WORKFLOW_CREATE = 'workflow.create',
  WORKFLOW_UPDATE = 'workflow.update',
  WORKFLOW_DELETE = 'workflow.delete',
  WORKFLOW_EXECUTE = 'workflow.execute',
  
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',
  
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_DENIED = 'permission.denied',
  
  SYSTEM_CONFIG_CHANGE = 'system.config.change'
}

export class AuditLogger {
  async log(
    userId: string,
    action: AuditAction,
    resource: string,
    details: Record<string, any> = {},
    request?: Request
  ) {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      resource,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      severity: this.getSeverity(action)
    }
    
    // Store in database
    await this.saveToDatabase(auditLog)
    
    // Alert on critical actions
    if (auditLog.severity === 'critical') {
      await this.sendSecurityAlert(auditLog)
    }
  }
  
  private getClientIP(request?: Request): string {
    if (!request) return 'unknown'
    
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown'
  }
  
  private getSeverity(action: AuditAction): AuditLog['severity'] {
    const criticalActions = [
      AuditAction.DATA_DELETE,
      AuditAction.SYSTEM_CONFIG_CHANGE,
      AuditAction.PERMISSION_GRANTED
    ]
    
    const highActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.PASSWORD_CHANGE,
      AuditAction.WORKFLOW_DELETE,
      AuditAction.DATA_EXPORT
    ]
    
    if (criticalActions.includes(action)) return 'critical'
    if (highActions.includes(action)) return 'high'
    return 'medium'
  }
  
  private async saveToDatabase(auditLog: AuditLog) {
    // Implementation depends on your database
    // Example with Prisma:
    /*
    await prisma.auditLog.create({
      data: auditLog
    })
    */
  }
  
  private async sendSecurityAlert(auditLog: AuditLog) {
    // Send email/Slack notification for critical security events
    console.log('SECURITY ALERT:', auditLog)
  }
}

export const auditLogger = new AuditLogger()

// Usage decorator
export function auditAction(action: AuditAction, resource: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args: any[]) {
      const userId = this.getCurrentUserId() // Implementation depends on context
      const request = this.getCurrentRequest() // Implementation depends on context
      
      try {
        const result = await originalMethod.apply(this, args)
        
        await auditLogger.log(userId, action, resource, { success: true }, request)
        
        return result
      } catch (error) {
        await auditLogger.log(
          userId, 
          action, 
          resource, 
          { success: false, error: error.message },
          request
        )
        throw error
      }
    }
  }
}
```

---

## Session Management

### Secure Session Implementation
```typescript
// lib/security/session.ts
import { Redis } from 'ioredis'

export interface SessionData {
  userId: string
  email: string
  role: string
  loginTime: number
  lastActivity: number
  ipAddress: string
  userAgent: string
}

export const SESSION_CONFIG = {
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  renewThreshold: 15 * 60 * 1000, // Renew if < 15 minutes left
  maxConcurrentSessions: 3,
  requireSameIP: false,
  requireSameUserAgent: false
}

export class SessionManager {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }
  
  async createSession(
    userId: string,
    sessionData: Omit<SessionData, 'loginTime' | 'lastActivity'>
  ): Promise<string> {
    const sessionId = crypto.randomUUID()
    const now = Date.now()
    
    const session: SessionData = {
      ...sessionData,
      loginTime: now,
      lastActivity: now
    }
    
    // Cleanup old sessions if user has too many
    await this.cleanupUserSessions(userId)
    
    // Store session
    await this.redis.setex(
      `session:${sessionId}`,
      Math.ceil(SESSION_CONFIG.maxAge / 1000),
      JSON.stringify(session)
    )
    
    // Track user sessions
    await this.redis.sadd(`user_sessions:${userId}`, sessionId)
    
    return sessionId
  }
  
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`)
    
    if (!sessionData) {
      return null
    }
    
    const session: SessionData = JSON.parse(sessionData)
    
    // Check if session expired
    if (Date.now() - session.lastActivity > SESSION_CONFIG.maxAge) {
      await this.destroySession(sessionId)
      return null
    }
    
    // Update last activity
    session.lastActivity = Date.now()
    await this.redis.setex(
      `session:${sessionId}`,
      Math.ceil(SESSION_CONFIG.maxAge / 1000),
      JSON.stringify(session)
    )
    
    return session
  }
  
  async destroySession(sessionId: string): Promise<void> {
    const sessionData = await this.redis.get(`session:${sessionId}`)
    
    if (sessionData) {
      const session: SessionData = JSON.parse(sessionData)
      await this.redis.srem(`user_sessions:${session.userId}`, sessionId)
    }
    
    await this.redis.del(`session:${sessionId}`)
  }
  
  async destroyAllUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(`user_sessions:${userId}`)
    
    for (const sessionId of sessionIds) {
      await this.redis.del(`session:${sessionId}`)
    }
    
    await this.redis.del(`user_sessions:${userId}`)
  }
  
  private async cleanupUserSessions(userId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(`user_sessions:${userId}`)
    
    if (sessionIds.length >= SESSION_CONFIG.maxConcurrentSessions) {
      // Get session details to find oldest
      const sessions = await Promise.all(
        sessionIds.map(async (id) => {
          const data = await this.redis.get(`session:${id}`)
          return data ? { id, data: JSON.parse(data) } : null
        })
      )
      
      const validSessions = sessions.filter(Boolean) as Array<{ id: string; data: SessionData }>
      
      // Sort by last activity (oldest first)
      validSessions.sort((a, b) => a.data.lastActivity - b.data.lastActivity)
      
      // Remove oldest sessions
      const toRemove = validSessions.slice(0, validSessions.length - SESSION_CONFIG.maxConcurrentSessions + 1)
      
      for (const session of toRemove) {
        await this.destroySession(session.id)
      }
    }
  }
}

export const sessionManager = new SessionManager()
```

---

## Environment & Configuration Security

### Environment Variables
```bash
# .env.example - Template for secure environment variables

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mindhill"
DATABASE_SSL_MODE="require"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-256-bits-long"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-256-bits-long"
ENCRYPTION_KEY="your-super-secure-encryption-key-256-bits"

# Session
REDIS_URL="redis://localhost:6379"
SESSION_SECRET="your-super-secure-session-secret"

# 2FA
TOTP_ISSUER="Mind Hillmetric"

# Email (for notifications)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# Security
RATE_LIMIT_REDIS_URL="redis://localhost:6379/1"
CORS_ORIGINS="http://localhost:3000,https://mindhill.com"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL="info"
```

### Configuration Validation
```typescript
// lib/config/validation.ts
import { z } from 'zod'

const ConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  REDIS_URL: z.string().url(),
  
  // Optional with defaults
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
})

export function validateConfig() {
  try {
    return ConfigSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment configuration:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const config = validateConfig()
```

---

## Security Testing

### Automated Security Tests
```typescript
// __tests__/security/auth.test.ts
import { describe, test, expect, beforeEach } from '@jest/globals'
import { generateTokens, verifyAccessToken } from '@/lib/auth/jwt'
import { hashPassword, verifyPassword, validatePassword } from '@/lib/auth/password'

describe('Authentication Security', () => {
  describe('JWT Tokens', () => {
    test('should generate valid tokens', () => {
      const payload = { userId: '123', email: 'test@example.com', role: 'user' as const }
      const { accessToken, refreshToken } = generateTokens(payload)
      
      expect(accessToken).toBeTruthy()
      expect(refreshToken).toBeTruthy()
      
      const decoded = verifyAccessToken(accessToken)
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })
    
    test('should reject invalid tokens', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow()
    })
  })
  
  describe('Password Security', () => {
    test('should hash passwords securely', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
      expect(await verifyPassword(password, hash)).toBe(true)
      expect(await verifyPassword('wrong-password', hash)).toBe(false)
    })
    
    test('should validate password strength', () => {
      const weak = validatePassword('123')
      expect(weak.valid).toBe(false)
      expect(weak.errors.length).toBeGreaterThan(0)
      
      const strong = validatePassword('SecurePassword123!')
      expect(strong.valid).toBe(true)
      expect(strong.errors.length).toBe(0)
    })
  })
})

// __tests__/security/rate-limiting.test.ts
describe('Rate Limiting', () => {
  test('should enforce rate limits', async () => {
    const limiter = new RateLimiter()
    const config = {
      windowMs: 60000,
      maxRequests: 5,
      keyGenerator: (id: string) => `test:${id}`
    }
    
    // Should allow first 5 requests
    for (let i = 0; i < 5; i++) {
      const result = await limiter.checkLimit('test-user', config)
      expect(result.allowed).toBe(true)
    }
    
    // Should block 6th request
    const blocked = await limiter.checkLimit('test-user', config)
    expect(blocked.allowed).toBe(false)
  })
})
```

---

## Security Checklist

### Pre-Production Security Checklist

#### Authentication & Authorization
- [ ] JWT secrets are 256+ bits and stored securely
- [ ] Password hashing uses bcrypt with 12+ rounds
- [ ] 2FA is implemented and tested
- [ ] Session management is secure with proper expiration
- [ ] Role-based permissions are enforced
- [ ] API endpoints are properly protected

#### Data Protection
- [ ] All sensitive data is encrypted at rest
- [ ] Input validation is implemented on all endpoints
- [ ] SQL injection protection is in place
- [ ] XSS protection is implemented
- [ ] File uploads are validated and sanitized

#### Security Headers
- [ ] CSP headers are configured
- [ ] HSTS is enabled for HTTPS
- [ ] X-Frame-Options prevents clickjacking
- [ ] X-Content-Type-Options prevents MIME sniffing

#### Monitoring & Logging
- [ ] Security events are logged
- [ ] Rate limiting is implemented
- [ ] Failed login attempts are monitored
- [ ] Audit trails are maintained

#### Infrastructure
- [ ] Environment variables are secured
- [ ] CORS is properly configured
- [ ] Database connections use SSL
- [ ] Regular security updates are applied

### Security Incident Response Plan

1. **Detection**: Monitor logs and alerts for security events
2. **Assessment**: Determine severity and scope of incident
3. **Containment**: Isolate affected systems and revoke compromised credentials
4. **Investigation**: Analyze logs and determine root cause
5. **Recovery**: Restore systems and implement fixes
6. **Documentation**: Record incident details and lessons learned

### Regular Security Maintenance

- **Weekly**: Review security logs and failed login attempts
- **Monthly**: Update dependencies and apply security patches
- **Quarterly**: Conduct security audits and penetration testing
- **Annually**: Review and update security policies and procedures

---

## Emergency Security Contacts

- **Security Team**: security@mindhill.com
- **Incident Response**: incidents@mindhill.com
- **24/7 Hotline**: +1-555-SECURITY

---

*This security guide should be reviewed and updated quarterly to ensure compliance with the latest security standards and threat landscape.*