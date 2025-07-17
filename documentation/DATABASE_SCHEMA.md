# Database Schema Documentation
## Mind Hillmetric Database Structure & Design

### Overview
Complete database schema documentation with exact table structures, relationships, indexes, constraints, and data migration strategies for Mind Hillmetric application.

---

## Database Technology Stack

### PostgreSQL Configuration
```sql
-- Database creation and configuration
CREATE DATABASE mindhill_production
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set timezone
SET timezone = 'UTC';
```

### Connection Pool Settings
```javascript
// Database connection configuration
const DATABASE_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 20,
    acquire: 60000,
    idle: 10000,
    evict: 1000,
    handleDisconnects: true
  },
  
  // Query settings
  dialectOptions: {
    statement_timeout: 30000,
    idle_in_transaction_session_timeout: 30000
  }
}
```

---

## Core Schema Tables

### 1. Users Table
```sql
-- Users table for authentication and authorization
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    
    -- Profile information
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    profile_image_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- Security
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],
    
    -- Preferences
    notification_preferences JSONB DEFAULT '{}',
    ui_preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_role_active ON users(role, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(is_email_verified, email_verified_at);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE is_active = true;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Workflows Table
```sql
-- Workflows table for workflow definitions
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- Configuration
    configuration JSONB NOT NULL DEFAULT '{}',
    schedule_cron VARCHAR(100),
    timeout_minutes INTEGER DEFAULT 60,
    max_retries INTEGER DEFAULT 3,
    
    -- Metadata
    category VARCHAR(50),
    tags TEXT[],
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    template_name VARCHAR(100),
    
    -- Relationships
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
    
    -- Statistics (denormalized for performance)
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP,
    average_duration_minutes DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

-- Indexes for workflows table
CREATE INDEX idx_workflows_status_updated ON workflows(status, updated_at DESC);
CREATE INDEX idx_workflows_name_trgm ON workflows USING gin(name gin_trgm_ops);
CREATE INDEX idx_workflows_created_by ON workflows(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_workflows_category ON workflows(category) WHERE category IS NOT NULL;
CREATE INDEX idx_workflows_tags ON workflows USING gin(tags);
CREATE INDEX idx_workflows_template ON workflows(is_template, template_name) WHERE is_template = true;
CREATE INDEX idx_workflows_parent ON workflows(parent_workflow_id) WHERE parent_workflow_id IS NOT NULL;
CREATE INDEX idx_workflows_schedule ON workflows(schedule_cron, status) WHERE schedule_cron IS NOT NULL;
CREATE INDEX idx_workflows_last_execution ON workflows(last_execution_at DESC) WHERE last_execution_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Workflow Executions Table
```sql
-- Workflow executions table for execution history
CREATE TABLE workflow_executions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    
    -- Execution details
    run_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'Created' CHECK (status IN ('Created', 'InProgress', 'Success', 'Failed', 'Cancelled', 'Timeout')),
    priority INTEGER DEFAULT 0,
    
    -- Timing
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_minutes DECIMAL(10,2),
    
    -- Progress tracking
    current_stage VARCHAR(50),
    current_stage_order INTEGER DEFAULT 0,
    total_stages INTEGER DEFAULT 0,
    stages_completed INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Resources and performance
    memory_usage_mb INTEGER,
    cpu_usage_percentage DECIMAL(5,2),
    content_processed INTEGER DEFAULT 0,
    bytes_processed BIGINT DEFAULT 0,
    
    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    triggered_by VARCHAR(50) DEFAULT 'manual', -- manual, schedule, api, webhook
    trigger_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    environment_info JSONB,
    execution_context JSONB,
    
    -- Relationships
    parent_execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for workflow_executions table
CREATE INDEX idx_executions_workflow_started ON workflow_executions(workflow_id, started_at DESC);
CREATE INDEX idx_executions_status_created ON workflow_executions(status, created_at DESC);
CREATE INDEX idx_executions_run_number ON workflow_executions(workflow_id, run_number DESC);
CREATE INDEX idx_executions_scheduled ON workflow_executions(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_executions_duration ON workflow_executions(duration_minutes) WHERE duration_minutes IS NOT NULL;
CREATE INDEX idx_executions_triggered_by ON workflow_executions(triggered_by, trigger_user_id);
CREATE INDEX idx_executions_parent ON workflow_executions(parent_execution_id) WHERE parent_execution_id IS NOT NULL;
CREATE INDEX idx_executions_error ON workflow_executions(status, error_code) WHERE status = 'Failed';
CREATE UNIQUE INDEX idx_executions_workflow_run_number ON workflow_executions(workflow_id, run_number);

-- Partial indexes for active executions
CREATE INDEX idx_active_executions ON workflow_executions(workflow_id, started_at DESC) 
    WHERE status IN ('Created', 'InProgress');

-- Trigger for updated_at
CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON workflow_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Execution Stages Table
```sql
-- Execution stages table for granular stage tracking
CREATE TABLE execution_stages (
    id SERIAL PRIMARY KEY,
    execution_id INTEGER NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    
    -- Stage identification
    stage_name VARCHAR(100) NOT NULL,
    stage_type VARCHAR(50) NOT NULL, -- fetching, processing, normalization, refinement, calculation
    stage_order INTEGER NOT NULL,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'Created' CHECK (status IN ('Created', 'InProgress', 'Success', 'Failed', 'Skipped')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Progress and metrics
    items_to_process INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    items_successful INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Performance metrics
    throughput_per_second DECIMAL(10,2),
    memory_usage_mb INTEGER,
    cpu_usage_percentage DECIMAL(5,2),
    
    -- Stage-specific data
    stage_configuration JSONB,
    stage_output JSONB,
    stage_metadata JSONB,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    
    -- Relationships
    depends_on_stage_id INTEGER REFERENCES execution_stages(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for execution_stages table
CREATE INDEX idx_stages_execution_order ON execution_stages(execution_id, stage_order);
CREATE INDEX idx_stages_status_timing ON execution_stages(status, started_at DESC);
CREATE INDEX idx_stages_type_status ON execution_stages(stage_type, status);
CREATE INDEX idx_stages_duration ON execution_stages(duration_seconds DESC) WHERE duration_seconds IS NOT NULL;
CREATE INDEX idx_stages_dependency ON execution_stages(depends_on_stage_id) WHERE depends_on_stage_id IS NOT NULL;
CREATE UNIQUE INDEX idx_stages_execution_order_unique ON execution_stages(execution_id, stage_order);

-- Trigger for updated_at
CREATE TRIGGER update_execution_stages_updated_at BEFORE UPDATE ON execution_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Data Processing Tables

### 5. Fetching History Table
```sql
-- Fetching history table for data collection tracking
CREATE TABLE fetching_history (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Identifiers
    fetching_id INTEGER UNIQUE NOT NULL, -- Business ID
    flux_id INTEGER NOT NULL,
    execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE SET NULL,
    stage_id INTEGER REFERENCES execution_stages(id) ON DELETE SET NULL,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'Created' CHECK (status IN ('Created', 'InProgress', 'Success', 'Failed', 'Cancelled')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    fetching_time_seconds INTEGER,
    
    -- Data source information
    data_source_url TEXT,
    data_source_type VARCHAR(50), -- api, file, database, webhook
    data_source_config JSONB,
    
    -- Results
    number_of_content INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    content_types JSONB, -- {"pdf": 10, "docx": 5, "xlsx": 2}
    
    -- Performance metrics
    throughput_mbps DECIMAL(10,2),
    requests_per_second DECIMAL(10,2),
    average_response_time_ms INTEGER,
    
    -- Error handling
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    retry_attempts INTEGER DEFAULT 0,
    
    -- Metadata
    fetching_config JSONB,
    headers_sent JSONB,
    headers_received JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fetching_history table
CREATE INDEX idx_fetching_flux_timestamp ON fetching_history(flux_id, timestamp DESC);
CREATE INDEX idx_fetching_status_completed ON fetching_history(status, completed_at DESC) 
    WHERE completed_at IS NOT NULL;
CREATE INDEX idx_fetching_execution ON fetching_history(execution_id) WHERE execution_id IS NOT NULL;
CREATE INDEX idx_fetching_data_source ON fetching_history(data_source_type, data_source_url);
CREATE INDEX idx_fetching_size ON fetching_history(total_size_bytes DESC) WHERE total_size_bytes > 0;
CREATE INDEX idx_fetching_performance ON fetching_history(throughput_mbps DESC) WHERE throughput_mbps IS NOT NULL;

-- Unique constraint for business logic
CREATE UNIQUE INDEX idx_fetching_id_unique ON fetching_history(fetching_id);

-- Trigger for updated_at
CREATE TRIGGER update_fetching_history_updated_at BEFORE UPDATE ON fetching_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Processing History Table
```sql
-- Processing history table for data processing tracking
CREATE TABLE processing_history (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Identifiers
    processing_id INTEGER UNIQUE NOT NULL, -- Business ID
    fetching_id INTEGER NOT NULL REFERENCES fetching_history(fetching_id) ON DELETE CASCADE,
    flux_id INTEGER NOT NULL,
    execution_id INTEGER REFERENCES workflow_executions(id) ON DELETE SET NULL,
    stage_id INTEGER REFERENCES execution_stages(id) ON DELETE SET NULL,
    
    -- Status and timing
    status VARCHAR(20) DEFAULT 'Created' CHECK (status IN ('Created', 'InProgress', 'Success', 'Failed', 'Cancelled')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time_seconds INTEGER,
    
    -- Processing details
    processing_type VARCHAR(50), -- normalization, refinement, calculation, analysis
    processing_algorithm VARCHAR(100),
    processing_config JSONB,
    
    -- Results
    number_of_processing_content INTEGER DEFAULT 0,
    content_processed INTEGER DEFAULT 0,
    content_successful INTEGER DEFAULT 0,
    content_failed INTEGER DEFAULT 0,
    
    -- Performance metrics
    items_per_second DECIMAL(10,2),
    memory_usage_peak_mb INTEGER,
    cpu_utilization_percentage DECIMAL(5,2),
    
    -- Quality metrics
    accuracy_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    quality_metrics JSONB,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    failed_items JSONB,
    
    -- Metadata
    processing_metadata JSONB,
    input_hash VARCHAR(64), -- SHA256 hash of input data
    output_hash VARCHAR(64), -- SHA256 hash of output data
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for processing_history table
CREATE INDEX idx_processing_fetching_timestamp ON processing_history(fetching_id, timestamp DESC);
CREATE INDEX idx_processing_flux_type ON processing_history(flux_id, processing_type);
CREATE INDEX idx_processing_status_timing ON processing_history(status, completed_at DESC);
CREATE INDEX idx_processing_execution ON processing_history(execution_id) WHERE execution_id IS NOT NULL;
CREATE INDEX idx_processing_performance ON processing_history(items_per_second DESC) WHERE items_per_second IS NOT NULL;
CREATE INDEX idx_processing_quality ON processing_history(accuracy_score DESC, confidence_score DESC);
CREATE INDEX idx_processing_algorithm ON processing_history(processing_algorithm, processing_type);

-- Unique constraint for business logic
CREATE UNIQUE INDEX idx_processing_id_unique ON processing_history(processing_id);

-- Trigger for updated_at
CREATE TRIGGER update_processing_history_updated_at BEFORE UPDATE ON processing_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Fetched Contents Table
```sql
-- Fetched contents table for individual content items
CREATE TABLE fetched_contents (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Identifiers
    content_id INTEGER UNIQUE NOT NULL, -- Business ID
    fetching_id INTEGER NOT NULL REFERENCES fetching_history(fetching_id) ON DELETE CASCADE,
    flux_id INTEGER NOT NULL,
    
    -- Content information
    content_name VARCHAR(500),
    content_type VARCHAR(100), -- application/pdf, text/plain, image/jpeg, etc.
    file_extension VARCHAR(10),
    file_size_bytes BIGINT,
    
    -- Content metadata
    mime_type VARCHAR(100),
    encoding VARCHAR(50),
    language VARCHAR(10),
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'fetched' CHECK (status IN ('fetched', 'processing', 'processed', 'failed', 'archived')),
    processing_priority INTEGER DEFAULT 0,
    
    -- Content storage
    storage_path TEXT,
    storage_type VARCHAR(50) DEFAULT 'local', -- local, s3, gcs, azure
    storage_metadata JSONB,
    
    -- Content analysis
    content_hash VARCHAR(64), -- SHA256 hash
    content_preview TEXT, -- First 1000 characters
    word_count INTEGER,
    page_count INTEGER,
    
    -- Classification
    content_category VARCHAR(100),
    content_tags TEXT[],
    classification_confidence DECIMAL(5,2),
    
    -- Security
    is_encrypted BOOLEAN DEFAULT false,
    encryption_key_id VARCHAR(100),
    virus_scan_status VARCHAR(20), -- clean, infected, unknown
    virus_scan_at TIMESTAMP,
    
    -- Access control
    access_level VARCHAR(20) DEFAULT 'internal', -- public, internal, restricted, confidential
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    expires_at TIMESTAMP,
    archived_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fetched_contents table
CREATE INDEX idx_content_fetching_type ON fetched_contents(fetching_id, content_type);
CREATE INDEX idx_content_status_priority ON fetched_contents(status, processing_priority DESC);
CREATE INDEX idx_content_flux_status ON fetched_contents(flux_id, status);
CREATE INDEX idx_content_hash ON fetched_contents(content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX idx_content_size ON fetched_contents(file_size_bytes DESC) WHERE file_size_bytes IS NOT NULL;
CREATE INDEX idx_content_category ON fetched_contents(content_category) WHERE content_category IS NOT NULL;
CREATE INDEX idx_content_tags ON fetched_contents USING gin(content_tags);
CREATE INDEX idx_content_classification ON fetched_contents(classification_confidence DESC);
CREATE INDEX idx_content_security ON fetched_contents(virus_scan_status, access_level);
CREATE INDEX idx_content_expiry ON fetched_contents(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_content_name_search ON fetched_contents USING gin(content_name gin_trgm_ops);

-- Unique constraint for business logic
CREATE UNIQUE INDEX idx_content_id_unique ON fetched_contents(content_id);

-- Trigger for updated_at
CREATE TRIGGER update_fetched_contents_updated_at BEFORE UPDATE ON fetched_contents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Reporting and Analytics Tables

### 8. Flux Reports Table
```sql
-- Flux reports table for report definitions
CREATE TABLE flux_reports (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Report identification
    report_name VARCHAR(200) NOT NULL,
    report_description TEXT,
    report_type VARCHAR(50) NOT NULL, -- summary, detailed, custom, scheduled
    category VARCHAR(100),
    
    -- Configuration
    report_config JSONB NOT NULL DEFAULT '{}',
    data_sources JSONB, -- Array of data source configurations
    filters JSONB, -- Default filters
    grouping JSONB, -- Grouping and aggregation rules
    sorting JSONB, -- Default sorting
    
    -- Schedule configuration
    is_scheduled BOOLEAN DEFAULT false,
    schedule_cron VARCHAR(100),
    schedule_timezone VARCHAR(50) DEFAULT 'UTC',
    next_run_at TIMESTAMP,
    
    -- Output configuration
    output_formats TEXT[] DEFAULT ARRAY['html'], -- html, pdf, csv, xlsx, json
    email_recipients TEXT[],
    webhook_url TEXT,
    
    -- Access control
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_users INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    is_public BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- Statistics
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMP,
    last_run_status VARCHAR(20),
    average_generation_time_seconds INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

-- Indexes for flux_reports table
CREATE INDEX idx_reports_name_search ON flux_reports USING gin(report_name gin_trgm_ops);
CREATE INDEX idx_reports_category_status ON flux_reports(category, status);
CREATE INDEX idx_reports_created_by ON flux_reports(created_by, created_at DESC);
CREATE INDEX idx_reports_scheduled ON flux_reports(is_scheduled, next_run_at) WHERE is_scheduled = true;
CREATE INDEX idx_reports_public ON flux_reports(is_public, status) WHERE is_public = true;
CREATE INDEX idx_reports_type ON flux_reports(report_type, status);
CREATE INDEX idx_reports_last_run ON flux_reports(last_run_at DESC) WHERE last_run_at IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_flux_reports_updated_at BEFORE UPDATE ON flux_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9. Report Executions Table
```sql
-- Report executions table for report generation history
CREATE TABLE report_executions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Report identification
    report_id INTEGER NOT NULL REFERENCES flux_reports(id) ON DELETE CASCADE,
    execution_name VARCHAR(200),
    
    -- Execution details
    status VARCHAR(20) DEFAULT 'Created' CHECK (status IN ('Created', 'InProgress', 'Success', 'Failed', 'Cancelled')),
    triggered_by VARCHAR(50) DEFAULT 'manual', -- manual, schedule, api
    trigger_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    generation_time_seconds INTEGER,
    
    -- Configuration used
    report_config JSONB, -- Snapshot of config at execution time
    filters_applied JSONB,
    date_range JSONB,
    
    -- Results
    output_format VARCHAR(20),
    output_file_path TEXT,
    output_file_size_bytes BIGINT,
    output_url TEXT,
    
    -- Data metrics
    records_processed INTEGER DEFAULT 0,
    data_points_included INTEGER DEFAULT 0,
    charts_generated INTEGER DEFAULT 0,
    
    -- Performance metrics
    query_time_seconds DECIMAL(10,2),
    render_time_seconds DECIMAL(10,2),
    memory_usage_mb INTEGER,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB,
    warnings JSONB,
    
    -- Delivery
    email_sent_at TIMESTAMP,
    email_recipients TEXT[],
    webhook_called_at TIMESTAMP,
    webhook_response_code INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for report_executions table
CREATE INDEX idx_report_executions_report_started ON report_executions(report_id, started_at DESC);
CREATE INDEX idx_report_executions_status_created ON report_executions(status, created_at DESC);
CREATE INDEX idx_report_executions_trigger ON report_executions(triggered_by, trigger_user_id);
CREATE INDEX idx_report_executions_performance ON report_executions(generation_time_seconds DESC);
CREATE INDEX idx_report_executions_size ON report_executions(output_file_size_bytes DESC) WHERE output_file_size_bytes IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_report_executions_updated_at BEFORE UPDATE ON report_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## System and Audit Tables

### 10. Audit Logs Table
```sql
-- Audit logs table for security and compliance
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, export, etc.
    event_category VARCHAR(50) NOT NULL, -- auth, workflow, data, admin, security
    event_action VARCHAR(100) NOT NULL, -- Specific action taken
    
    -- User and session information
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    
    -- Resource information
    resource_type VARCHAR(100), -- workflow, execution, content, user, etc.
    resource_id VARCHAR(100),
    resource_name VARCHAR(200),
    
    -- Event details
    event_details JSONB,
    old_values JSONB, -- For update operations
    new_values JSONB, -- For create/update operations
    
    -- Request information
    request_method VARCHAR(10),
    request_url TEXT,
    request_headers JSONB,
    request_body TEXT,
    response_status INTEGER,
    
    -- Security classification
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Compliance
    compliance_tags TEXT[],
    retention_period_days INTEGER DEFAULT 2555, -- 7 years default
    
    -- Timestamps
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_event_category ON audit_logs(event_category, event_type, timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_severity ON audit_logs(severity, timestamp DESC) WHERE severity IN ('high', 'critical');
CREATE INDEX idx_audit_ip_address ON audit_logs(ip_address, timestamp DESC);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_compliance ON audit_logs USING gin(compliance_tags);
CREATE INDEX idx_audit_session ON audit_logs(session_id, timestamp DESC) WHERE session_id IS NOT NULL;

-- Partial index for security events
CREATE INDEX idx_audit_security_events ON audit_logs(timestamp DESC, event_details) 
    WHERE event_category = 'security' OR severity IN ('high', 'critical');
```

### 11. System Settings Table
```sql
-- System settings table for application configuration
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    
    -- Setting identification
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_category VARCHAR(50) NOT NULL,
    setting_name VARCHAR(200) NOT NULL,
    setting_description TEXT,
    
    -- Value information
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'integer', 'decimal', 'boolean', 'json', 'array')),
    default_value TEXT,
    
    -- Validation
    validation_rules JSONB, -- JSON schema or validation rules
    allowed_values TEXT[], -- For enum-type settings
    min_value DECIMAL,
    max_value DECIMAL,
    
    -- Access control
    is_public BOOLEAN DEFAULT false, -- Can be read by non-admin users
    is_readonly BOOLEAN DEFAULT false, -- Cannot be modified via UI
    requires_restart BOOLEAN DEFAULT false, -- Requires app restart to take effect
    
    -- Environment specific
    environment VARCHAR(20) DEFAULT 'all', -- all, development, staging, production
    
    -- Metadata
    last_modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_modified_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for system_settings table
CREATE INDEX idx_settings_category ON system_settings(setting_category, setting_key);
CREATE INDEX idx_settings_public ON system_settings(is_public, setting_category) WHERE is_public = true;
CREATE INDEX idx_settings_environment ON system_settings(environment, setting_category);
CREATE UNIQUE INDEX idx_settings_key_environment ON system_settings(setting_key, environment);

-- Trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_category, setting_name, setting_description, setting_value, setting_type, default_value) VALUES
('max_concurrent_workflows', 'performance', 'Maximum Concurrent Workflows', 'Maximum number of workflows that can run simultaneously', '5', 'integer', '5'),
('default_workflow_timeout', 'workflow', 'Default Workflow Timeout', 'Default timeout for workflows in minutes', '60', 'integer', '60'),
('max_file_size_mb', 'content', 'Maximum File Size', 'Maximum file size allowed for upload in MB', '100', 'integer', '100'),
('retention_period_days', 'data', 'Data Retention Period', 'Number of days to retain execution data', '90', 'integer', '90'),
('enable_email_notifications', 'notifications', 'Enable Email Notifications', 'Whether to send email notifications', 'true', 'boolean', 'true'),
('api_rate_limit_per_hour', 'security', 'API Rate Limit', 'Number of API requests allowed per hour per user', '1000', 'integer', '1000'),
('backup_frequency_hours', 'system', 'Backup Frequency', 'How often to run automatic backups in hours', '24', 'integer', '24');
```

### 12. Application Sessions Table
```sql
-- Application sessions table for session management
CREATE TABLE application_sessions (
    id SERIAL PRIMARY KEY,
    
    -- Session identification
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    session_data JSONB,
    user_agent TEXT,
    ip_address INET,
    
    -- Device information
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser_name VARCHAR(50),
    browser_version VARCHAR(20),
    os_name VARCHAR(50),
    os_version VARCHAR(20),
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    is_remembered BOOLEAN DEFAULT false,
    
    -- Security
    csrf_token VARCHAR(255),
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    invalidated_at TIMESTAMP
);

-- Indexes for application_sessions table
CREATE INDEX idx_sessions_user_active ON application_sessions(user_id, is_active, last_activity_at DESC);
CREATE INDEX idx_sessions_expiry ON application_sessions(expires_at) WHERE is_active = true;
CREATE INDEX idx_sessions_ip_address ON application_sessions(ip_address, created_at DESC);
CREATE INDEX idx_sessions_device ON application_sessions(device_type, browser_name);
CREATE INDEX idx_sessions_cleanup ON application_sessions(is_active, expires_at) WHERE is_active = false OR expires_at < CURRENT_TIMESTAMP;
```

---

## Database Views for Complex Queries

### 1. Workflow Execution Summary View
```sql
-- View for workflow execution summaries with statistics
CREATE OR REPLACE VIEW workflow_execution_summary AS
SELECT 
    w.id as workflow_id,
    w.name as workflow_name,
    w.status as workflow_status,
    COUNT(we.id) as total_executions,
    COUNT(CASE WHEN we.status = 'Success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN we.status = 'Failed' THEN 1 END) as failed_executions,
    COUNT(CASE WHEN we.status = 'InProgress' THEN 1 END) as active_executions,
    ROUND(
        (COUNT(CASE WHEN we.status = 'Success' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(we.id), 0) * 100), 2
    ) as success_rate_percentage,
    AVG(we.duration_minutes) as avg_duration_minutes,
    MIN(we.duration_minutes) as min_duration_minutes,
    MAX(we.duration_minutes) as max_duration_minutes,
    MAX(we.started_at) as last_execution_at,
    SUM(we.content_processed) as total_content_processed,
    AVG(we.content_processed) as avg_content_per_execution
FROM workflows w
LEFT JOIN workflow_executions we ON w.id = we.workflow_id
WHERE w.archived_at IS NULL
GROUP BY w.id, w.name, w.status;

-- Index for the view
CREATE INDEX idx_workflow_execution_summary_stats ON workflow_executions(workflow_id, status, duration_minutes, content_processed);
```

### 2. Daily Execution Metrics View
```sql
-- View for daily execution metrics and trends
CREATE OR REPLACE VIEW daily_execution_metrics AS
SELECT 
    DATE(we.started_at) as execution_date,
    COUNT(*) as total_executions,
    COUNT(CASE WHEN we.status = 'Success' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN we.status = 'Failed' THEN 1 END) as failed_executions,
    AVG(we.duration_minutes) as avg_duration_minutes,
    SUM(we.content_processed) as total_content_processed,
    COUNT(DISTINCT we.workflow_id) as unique_workflows_executed,
    AVG(CASE WHEN we.status = 'Success' THEN we.duration_minutes END) as avg_successful_duration,
    AVG(CASE WHEN we.status = 'Failed' THEN we.duration_minutes END) as avg_failed_duration
FROM workflow_executions we
WHERE we.started_at IS NOT NULL
    AND we.started_at >= CURRENT_DATE - INTERVAL '90 days' -- Last 90 days
GROUP BY DATE(we.started_at)
ORDER BY execution_date DESC;
```

### 3. Performance Metrics View
```sql
-- View for performance analysis across different dimensions
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    'workflow' as metric_type,
    w.id as entity_id,
    w.name as entity_name,
    COUNT(we.id) as execution_count,
    AVG(we.duration_minutes) as avg_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY we.duration_minutes) as p95_duration,
    AVG(we.content_processed) as avg_throughput,
    STDDEV(we.duration_minutes) as duration_stddev,
    MAX(we.started_at) as last_execution
FROM workflows w
JOIN workflow_executions we ON w.id = we.workflow_id
WHERE we.completed_at IS NOT NULL
    AND w.archived_at IS NULL
GROUP BY w.id, w.name

UNION ALL

SELECT 
    'stage' as metric_type,
    es.stage_type::TEXT as entity_id,
    es.stage_type as entity_name,
    COUNT(es.id) as execution_count,
    AVG(es.duration_seconds / 60.0) as avg_duration,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY es.duration_seconds / 60.0) as p95_duration,
    AVG(es.items_processed) as avg_throughput,
    STDDEV(es.duration_seconds / 60.0) as duration_stddev,
    MAX(es.started_at) as last_execution
FROM execution_stages es
WHERE es.completed_at IS NOT NULL
GROUP BY es.stage_type;
```

---

## Database Functions and Stored Procedures

### 1. Workflow Statistics Function
```sql
-- Function to calculate comprehensive workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_statistics(
    p_workflow_id INTEGER,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
) RETURNS TABLE (
    total_executions INTEGER,
    successful_executions INTEGER,
    failed_executions INTEGER,
    success_rate DECIMAL(5,2),
    avg_duration_minutes DECIMAL(10,2),
    median_duration_minutes DECIMAL(10,2),
    total_content_processed BIGINT,
    avg_content_per_execution DECIMAL(10,2),
    last_execution_date TIMESTAMP,
    trend_direction VARCHAR(10)
) LANGUAGE plpgsql AS $$
DECLARE
    date_filter_start DATE := COALESCE(p_date_from, CURRENT_DATE - INTERVAL '30 days');
    date_filter_end DATE := COALESCE(p_date_to, CURRENT_DATE);
    prev_period_start DATE := date_filter_start - (date_filter_end - date_filter_start);
    prev_success_rate DECIMAL(5,2);
    current_success_rate DECIMAL(5,2);
BEGIN
    -- Current period statistics
    SELECT 
        COUNT(*)::INTEGER,
        COUNT(CASE WHEN we.status = 'Success' THEN 1 END)::INTEGER,
        COUNT(CASE WHEN we.status = 'Failed' THEN 1 END)::INTEGER,
        ROUND((COUNT(CASE WHEN we.status = 'Success' THEN 1 END)::DECIMAL / 
               NULLIF(COUNT(*), 0) * 100), 2),
        ROUND(AVG(we.duration_minutes), 2),
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY we.duration_minutes), 2),
        COALESCE(SUM(we.content_processed), 0),
        ROUND(AVG(we.content_processed), 2),
        MAX(we.started_at)
    INTO 
        total_executions,
        successful_executions,
        failed_executions,
        current_success_rate,
        avg_duration_minutes,
        median_duration_minutes,
        total_content_processed,
        avg_content_per_execution,
        last_execution_date
    FROM workflow_executions we
    WHERE we.workflow_id = p_workflow_id
        AND DATE(we.started_at) BETWEEN date_filter_start AND date_filter_end;

    success_rate := current_success_rate;

    -- Previous period success rate for trend analysis
    SELECT 
        ROUND((COUNT(CASE WHEN we.status = 'Success' THEN 1 END)::DECIMAL / 
               NULLIF(COUNT(*), 0) * 100), 2)
    INTO prev_success_rate
    FROM workflow_executions we
    WHERE we.workflow_id = p_workflow_id
        AND DATE(we.started_at) BETWEEN prev_period_start AND date_filter_start - 1;

    -- Determine trend direction
    trend_direction := CASE 
        WHEN prev_success_rate IS NULL THEN 'unknown'
        WHEN current_success_rate > prev_success_rate THEN 'improving'
        WHEN current_success_rate < prev_success_rate THEN 'declining'
        ELSE 'stable'
    END;

    RETURN NEXT;
END;
$$;
```

### 2. Data Cleanup Procedure
```sql
-- Procedure for automated data cleanup and archival
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    cleanup_count INTEGER := 0;
    retention_days INTEGER;
    cutoff_date TIMESTAMP;
BEGIN
    -- Get retention period from system settings
    SELECT setting_value::INTEGER 
    INTO retention_days
    FROM system_settings 
    WHERE setting_key = 'retention_period_days';
    
    -- Default to 90 days if not set
    retention_days := COALESCE(retention_days, 90);
    cutoff_date := CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
    
    -- Archive old workflow executions
    UPDATE workflow_executions 
    SET archived_at = CURRENT_TIMESTAMP
    WHERE completed_at < cutoff_date
        AND archived_at IS NULL;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Archive old fetched contents
    UPDATE fetched_contents 
    SET archived_at = CURRENT_TIMESTAMP
    WHERE created_at < cutoff_date
        AND archived_at IS NULL
        AND status IN ('processed', 'failed');
    
    -- Clean up expired sessions
    DELETE FROM application_sessions
    WHERE expires_at < CURRENT_TIMESTAMP
        OR (is_active = false AND invalidated_at < CURRENT_TIMESTAMP - INTERVAL '7 days');
    
    -- Clean up old audit logs (based on retention period)
    DELETE FROM audit_logs
    WHERE timestamp < CURRENT_TIMESTAMP - 
          COALESCE((SELECT MAX(retention_period_days) FROM audit_logs), 2555) * INTERVAL '1 day';
    
    RETURN cleanup_count;
END;
$$;

-- Schedule cleanup to run daily
-- This would typically be set up as a cron job or scheduled task
SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');
```

---

## Data Migration Scripts

### 1. Initial Schema Migration
```sql
-- Migration script for initial schema creation
-- This should be run as part of the deployment process

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create enum types
CREATE TYPE execution_status AS ENUM ('Created', 'InProgress', 'Success', 'Failed', 'Cancelled', 'Timeout');
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE workflow_status AS ENUM ('active', 'inactive', 'archived');

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(14) PRIMARY KEY, -- YYYYMMDDHHMMSS format
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial migration record
INSERT INTO schema_migrations (version, description) 
VALUES ('20240124000001', 'Initial schema creation')
ON CONFLICT (version) DO NOTHING;
```

### 2. Data Seeding Script
```sql
-- Seed script for initial data population
-- Run after schema creation

-- Create default admin user (password should be changed immediately)
INSERT INTO users (
    email, password_hash, display_name, role, is_active, is_email_verified, email_verified_at
) VALUES (
    'admin@mindhill.com', 
    '$2b$12$LQv3c1yqBwUjNhT5MzCBLeEUh7j2XrVAzJgZjyHC4zAhHXGl1QlVe', -- "admin123" - CHANGE THIS!
    'System Administrator',
    'admin',
    true,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Create default workflow templates
INSERT INTO workflows (
    name, description, status, configuration, is_template, template_name, created_by
) VALUES 
(
    'Data Processing Pipeline',
    'Standard data processing workflow template',
    'active',
    '{"stages": ["fetching", "processing", "normalization", "refinement", "calculation"], "timeout": 3600, "retries": 3}',
    true,
    'data-processing',
    (SELECT id FROM users WHERE email = 'admin@mindhill.com')
),
(
    'Document Analysis',
    'Document processing and analysis workflow template',
    'active',
    '{"stages": ["fetching", "processing", "analysis"], "timeout": 1800, "retries": 2}',
    true,
    'document-analysis',
    (SELECT id FROM users WHERE email = 'admin@mindhill.com')
) ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_category, setting_name, setting_value, setting_type) VALUES
('app_name', 'general', 'Application Name', 'Mind Hillmetric', 'string'),
('app_version', 'general', 'Application Version', '1.0.0', 'string'),
('timezone', 'general', 'Default Timezone', 'UTC', 'string'),
('date_format', 'general', 'Default Date Format', 'YYYY-MM-DD HH:mm:ss', 'string'),
('max_file_upload_size', 'limits', 'Max File Upload Size (MB)', '100', 'integer'),
('session_timeout_hours', 'security', 'Session Timeout (Hours)', '8', 'integer')
ON CONFLICT (setting_key, environment) DO NOTHING;
```

---

## Performance Optimization

### 1. Database Indexes Strategy
```sql
-- Performance indexes for optimal query performance
-- These indexes are strategically placed based on common query patterns

-- Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_workflow_status_date 
ON workflow_executions(workflow_id, status, started_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_executions_status_duration 
ON workflow_executions(status, duration_minutes DESC) 
WHERE duration_minutes IS NOT NULL;

-- Partial indexes for hot data paths
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_workflows 
ON workflows(updated_at DESC) 
WHERE status = 'active' AND archived_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recent_executions 
ON workflow_executions(started_at DESC, workflow_id, status) 
WHERE started_at > (CURRENT_DATE - INTERVAL '7 days');

-- GIN indexes for JSON and array columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_config_gin 
ON workflows USING gin(configuration);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_execution_context_gin 
ON workflow_executions USING gin(execution_context);

-- Text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_name_search 
ON workflows USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_name_search 
ON fetched_contents USING gin(to_tsvector('english', content_name || ' ' || COALESCE(content_preview, '')));
```

### 2. Query Optimization Examples
```sql
-- Optimized queries for common operations

-- 1. Dashboard workflow summary (optimized for performance)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    w.id,
    w.name,
    w.status,
    w.last_execution_at,
    COALESCE(stats.total_executions, 0) as total_executions,
    COALESCE(stats.success_rate, 0) as success_rate
FROM workflows w
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as total_executions,
        ROUND(
            (COUNT(CASE WHEN status = 'Success' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as success_rate
    FROM workflow_executions we
    WHERE we.workflow_id = w.id
        AND we.started_at > CURRENT_DATE - INTERVAL '30 days'
) stats ON true
WHERE w.status = 'active' 
    AND w.archived_at IS NULL
ORDER BY w.updated_at DESC
LIMIT 20;

-- 2. Execution history with pagination (optimized)
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    we.id,
    we.workflow_id,
    w.name as workflow_name,
    we.status,
    we.started_at,
    we.duration_minutes,
    we.content_processed
FROM workflow_executions we
INNER JOIN workflows w ON we.workflow_id = w.id
WHERE we.started_at BETWEEN $1 AND $2  -- Use parameters for date range
    AND ($3 IS NULL OR we.status = $3)  -- Optional status filter
ORDER BY we.started_at DESC
LIMIT $4 OFFSET $5;  -- Pagination parameters

-- 3. Content search with ranking (optimized for full-text search)
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
    fc.id,
    fc.content_name,
    fc.content_type,
    fc.file_size_bytes,
    ts_rank_cd(
        to_tsvector('english', fc.content_name || ' ' || COALESCE(fc.content_preview, '')),
        plainto_tsquery('english', $1)
    ) as relevance_score
FROM fetched_contents fc
WHERE to_tsvector('english', fc.content_name || ' ' || COALESCE(fc.content_preview, '')) 
      @@ plainto_tsquery('english', $1)
    AND fc.status = 'processed'
    AND fc.archived_at IS NULL
ORDER BY relevance_score DESC, fc.fetched_at DESC
LIMIT 50;
```

---

## Database Backup and Recovery

### 1. Backup Strategy
```bash
#!/bin/bash
# Database backup script for production

BACKUP_DIR="/var/backups/postgresql"
DATABASE="mindhill_production"
BACKUP_USER="backup_user"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -h localhost -U $BACKUP_USER -d $DATABASE \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/mindhill_full_$DATE.dump"

# Schema-only backup (for quick restore testing)
pg_dump -h localhost -U $BACKUP_USER -d $DATABASE \
    --schema-only \
    --format=custom \
    --verbose \
    --file="$BACKUP_DIR/mindhill_schema_$DATE.dump"

# Data-only backup for large tables
pg_dump -h localhost -U $BACKUP_USER -d $DATABASE \
    --data-only \
    --table=workflow_executions \
    --table=fetched_contents \
    --table=audit_logs \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/mindhill_data_$DATE.dump"

# Cleanup old backups
find $BACKUP_DIR -name "mindhill_*.dump" -mtime +$RETENTION_DAYS -delete

# Upload to cloud storage (example with AWS S3)
aws s3 sync $BACKUP_DIR s3://mindhill-backups/postgresql/ --delete

echo "Backup completed: $DATE"
```

### 2. Recovery Procedures
```bash
#!/bin/bash
# Database recovery script

BACKUP_FILE=$1
DATABASE="mindhill_production"
RECOVERY_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Starting database recovery from: $BACKUP_FILE"

# Create recovery database (drop if exists)
dropdb -U $RECOVERY_USER $DATABASE --if-exists
createdb -U $RECOVERY_USER $DATABASE

# Restore from backup
pg_restore -h localhost -U $RECOVERY_USER -d $DATABASE \
    --format=custom \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    $BACKUP_FILE

# Verify restoration
echo "Verifying restoration..."
psql -U $RECOVERY_USER -d $DATABASE -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;
"

echo "Recovery completed successfully"
```

---

## Database Monitoring Queries

### 1. Performance Monitoring
```sql
-- Query to monitor database performance metrics
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Active Connections',
    COUNT(*)::TEXT
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
    'Idle Connections',
    COUNT(*)::TEXT
FROM pg_stat_activity 
WHERE state = 'idle'
UNION ALL
SELECT 
    'Slow Queries (>5s)',
    COUNT(*)::TEXT
FROM pg_stat_activity 
WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '5 seconds'
    AND query NOT LIKE '%pg_stat_activity%';

-- Table sizes and statistics
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelname)) as index_size
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

### 2. Health Check Queries
```sql
-- Database health check query
WITH health_metrics AS (
    SELECT 
        'database_size_gb' as metric,
        ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0 / 1024.0, 2) as value,
        50.0 as warning_threshold,
        100.0 as critical_threshold
    UNION ALL
    SELECT 
        'active_connections',
        COUNT(*)::DECIMAL,
        80.0,
        100.0
    FROM pg_stat_activity WHERE state = 'active'
    UNION ALL
    SELECT 
        'oldest_transaction_minutes',
        EXTRACT(EPOCH FROM (NOW() - MIN(xact_start))) / 60.0,
        30.0,
        60.0
    FROM pg_stat_activity WHERE xact_start IS NOT NULL
    UNION ALL
    SELECT 
        'replication_lag_bytes',
        COALESCE(MAX(pg_wal_lsn_diff(sent_lsn, replay_lsn)), 0),
        1048576.0, -- 1MB
        10485760.0 -- 10MB
    FROM pg_stat_replication
)
SELECT 
    metric,
    value,
    CASE 
        WHEN value >= critical_threshold THEN 'CRITICAL'
        WHEN value >= warning_threshold THEN 'WARNING'
        ELSE 'OK'
    END as status,
    warning_threshold,
    critical_threshold
FROM health_metrics
ORDER BY 
    CASE 
        WHEN value >= critical_threshold THEN 1
        WHEN value >= warning_threshold THEN 2
        ELSE 3
    END,
    metric;
```

---

*This database schema documentation provides a complete foundation for the Mind Hillmetric application with proper indexing, relationships, and optimization strategies for production use.*