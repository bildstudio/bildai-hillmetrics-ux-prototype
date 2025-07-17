# User Manual
## Mind Hillmetric Application

### Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Workflow Management](#workflow-management)
4. [Data Processing](#data-processing)
5. [Search and Navigation](#search-and-navigation)
6. [Profile Management](#profile-management)
7. [Settings Configuration](#settings-configuration)
8. [Monitoring and Analytics](#monitoring-and-analytics)
9. [Troubleshooting](#troubleshooting)
10. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### 1. First Time Setup

#### Accessing the Application
1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to: `https://your-domain.com` or `http://localhost:3000` for development
3. You will see the login page

#### Creating Your Account
1. Click **"Sign Up"** on the login page
2. Fill in your details:
   - **Full Name**: Your first and last name
   - **Email Address**: Your work or personal email
   - **Password**: Must be at least 8 characters with numbers and symbols
   - **Confirm Password**: Re-enter your password
3. Click **"Create Account"**
4. Check your email for a verification link
5. Click the verification link to activate your account

#### First Login
1. Enter your **email address** and **password**
2. Click **"Sign In"**
3. You'll be taken to the main dashboard

#### Setting Up Your Profile
1. Click your **profile picture** in the top-right corner
2. Select **"Profile"** from the dropdown menu
3. Complete your profile information:
   - Upload a profile picture
   - Add your job title and department
   - Set your preferred language and timezone
   - Configure notification preferences
4. Click **"Save Changes"**

---

## Dashboard Overview

### 2. Main Dashboard Layout

#### Navigation Bar (Top)
- **Logo**: Click to return to dashboard from any page
- **Search Bar**: Global search across all data (center)
- **Profile Menu**: Access profile and settings (top-right)
- **Notifications**: View system alerts and updates

#### Sidebar Navigation (Left)
- **Dashboard**: Main overview page
- **Workflows**: Manage and view workflow executions
- **Data Processing**: Access normalization, refinement, and calculation tools
- **Analytics**: View performance metrics and reports
- **Settings**: Configure system preferences

#### Main Content Area
- **Quick Stats**: Key performance indicators
- **Recent Activity**: Latest workflow executions and data processing
- **Status Overview**: System health and processing status
- **Action Items**: Tasks requiring your attention

### 3. Understanding the Dashboard Cards

#### Workflow Execution Card
```
┌─────────────────────────────────────────┐
│ Workflow Run #WR-1234                   │
│ ┌─────────────────────────────────────┐ │
│ │ Fetching Stage                      │ │
│ │ Status: ✓ Completed | ID: FS-5678  │ │
│ │ Duration: 2.3s | Records: 1,250    │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Processing Stage                    │ │
│ │ Status: ⏳ Running | ID: PS-9012   │ │
│ │ Progress: 65% | ETA: 1.2 min       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**How to Use:**
- Click on **Workflow Run ID** to view detailed execution log
- Click on **Stage IDs** to view stage-specific details
- Hover over status icons for additional information
- Use the progress indicators to monitor active processes

---

## Workflow Management

### 4. Creating and Managing Workflows

#### Creating a New Workflow
1. Click **"Workflows"** in the sidebar
2. Click the **"+ New Workflow"** button
3. Choose a workflow template:
   - **Data Import**: For importing external data
   - **Data Processing**: For transforming existing data
   - **Analysis**: For generating reports and insights
   - **Custom**: Build from scratch

#### Workflow Configuration
1. **Basic Information**:
   - **Name**: Give your workflow a descriptive name
   - **Description**: Explain what this workflow does
   - **Priority**: Set execution priority (High, Medium, Low)
   - **Schedule**: Choose when to run (Manual, Scheduled, Triggered)

2. **Data Sources**:
   - Click **"Add Data Source"**
   - Select from available connections:
     - Database connections
     - File uploads (CSV, JSON, XML)
     - API endpoints
     - Cloud storage (AWS S3, Google Drive)

3. **Processing Steps**:
   - **Fetching**: Configure data retrieval parameters
   - **Normalization**: Set data cleaning and standardization rules
   - **Refinement**: Define data transformation logic
   - **Calculation**: Add business logic and computations

4. **Output Configuration**:
   - Choose output format (Database, File, API)
   - Set destination parameters
   - Configure notification settings

#### Running a Workflow
1. From the **Workflows** page, find your workflow
2. Click the **"Run"** button (▶️) next to the workflow name
3. Choose run options:
   - **Run Now**: Start immediately
   - **Schedule**: Set a future time
   - **Test Run**: Execute with sample data
4. Click **"Start Execution"**

#### Monitoring Workflow Execution
1. Click on the **Workflow Run ID** (e.g., WR-1234)
2. The execution blade will open showing:
   - **Overall Status**: Success, Running, Failed, or Queued
   - **Stage Progress**: Individual stage completion
   - **Execution Log**: Detailed step-by-step progress
   - **Performance Metrics**: Duration, records processed, errors
   - **Error Details**: If any issues occurred

### 5. Workflow Execution Log

#### Understanding the Log Interface
```
Workflow Execution Details - #WR-1234
Status: ✓ Completed | Started: 2024-01-15 09:30:15 | Duration: 5m 23s

Stages:
┌─ Fetching Stage (FS-5678) ────────────────────────┐
│ Status: ✓ Completed                               │
│ Duration: 1m 45s                                  │
│ Records Fetched: 10,450                          │
│ Data Sources: PostgreSQL, REST API               │
└───────────────────────────────────────────────────┘

┌─ Normalization Stage (NS-9101) ──────────────────┐
│ Status: ✓ Completed                               │
│ Duration: 2m 12s                                  │
│ Records Processed: 10,450                        │
│ Records Valid: 10,387 (99.4%)                   │
│ Records Rejected: 63 (0.6%)                     │
└───────────────────────────────────────────────────┘
```

#### Stage Details
Click on any **Stage ID** (like FS-5678) to view:
- **Configuration**: Settings used for this stage
- **Data Sample**: Preview of processed data
- **Logs**: Detailed processing messages
- **Errors**: Any issues encountered
- **Performance**: Processing speed and resource usage

---

## Data Processing

### 6. Normalization

#### Accessing Normalization
1. Click **"Data Processing"** in the sidebar
2. Click **"Normalization"** tab
3. You'll see a grid of all normalization operations

#### Understanding the Normalization Grid
```
┌─────────────────────────────────────────────────────────────────┐
│ ID       │ Status     │ Records │ Valid % │ Started    │ Actions │
├─────────────────────────────────────────────────────────────────┤
│ NR-1234  │ ✓Complete  │ 5,420   │ 98.5%   │ 09:30:15  │ [👁️📊] │
│ NR-1235  │ ⏳Running  │ 2,100   │ 95.2%   │ 09:45:22  │ [⏸️❌] │
│ NR-1236  │ ❌Failed   │ 0       │ 0%      │ 10:15:45  │ [🔄👁️] │
└─────────────────────────────────────────────────────────────────┘
```

#### Working with Normalization Records
1. **View Details**: Click the 👁️ (eye) icon to see detailed information
2. **View Charts**: Click the 📊 (chart) icon to see data quality metrics
3. **Pause Process**: Click ⏸️ to pause running operations
4. **Stop Process**: Click ❌ to cancel running operations
5. **Retry Failed**: Click 🔄 to retry failed operations

#### Creating a New Normalization Task
1. Click **"+ Add Normalization"** button
2. Configure settings:
   - **Source Data**: Select input dataset
   - **Validation Rules**: Define data quality checks
   - **Transformation Rules**: Set data cleaning operations
   - **Output Format**: Choose result structure
3. Click **"Start Normalization"**

### 7. Refinement

#### Accessing Refinement
1. Navigate to **Data Processing** → **Refinement**
2. The refinement grid shows all data refinement operations

#### Refinement Process
1. **Data Selection**: Choose which normalized data to refine
2. **Business Rules**: Apply domain-specific transformations
3. **Enrichment**: Add calculated fields and derived values
4. **Quality Assurance**: Validate refined data meets requirements

#### Monitoring Refinement
- **Progress Tracking**: Real-time updates on processing status
- **Quality Metrics**: Data accuracy and completeness scores
- **Error Handling**: Automatic retry and error reporting
- **Performance Monitoring**: Processing speed and resource usage

### 8. Calculation

#### Accessing Calculations
1. Go to **Data Processing** → **Calculation**
2. View all active and completed calculation operations

#### Types of Calculations
1. **Aggregations**: Sum, average, count, min, max operations
2. **Business Metrics**: KPIs and performance indicators
3. **Derived Fields**: Computed columns based on existing data
4. **Statistical Analysis**: Trends, correlations, and patterns

#### Running Calculations
1. Click **"+ New Calculation"**
2. Select calculation type and input data
3. Configure calculation parameters
4. Set output destination
5. Click **"Execute Calculation"**

---

## Search and Navigation

### 9. Global Search

#### Using the Search Bar
1. Click in the **search bar** at the top of the page
2. Type your search term (minimum 2 characters)
3. Select from auto-complete suggestions or press **Enter**

#### Search Categories
The search results are organized by type:
- **Workflows**: Find specific workflow executions
- **Flux Reports**: Search through flux data
- **Fetching Operations**: Locate data retrieval operations
- **Processing Tasks**: Find normalization, refinement, and calculation tasks
- **Content**: Search through processed data content

#### Search Tips
- Use **quotes** for exact phrases: `"workflow execution"`
- Use **wildcards** with asterisk: `WR-123*`
- Search by **ID**: `WR-1234`, `FS-5678`, `NR-9101`
- Search by **status**: `completed`, `running`, `failed`
- Search by **date range**: `2024-01-15` or `last week`

#### Advanced Search
1. Click the **filter icon** (🔍+) next to the search bar
2. Use advanced filters:
   - **Date Range**: Specific time periods
   - **Status**: Filter by completion status
   - **User**: Filter by who created/ran the item
   - **Type**: Limit to specific operation types
   - **Priority**: Filter by importance level

### 10. Navigation Features

#### Breadcrumb Navigation
Always visible at the top of content area:
```
Dashboard > Workflows > Execution Details > Stage View
```
Click any breadcrumb item to navigate back to that level.

#### Blade System
The application uses a "blade" system for detailed views:
- **Primary Blade**: Main content area
- **Secondary Blade**: Detailed views slide in from the right
- **Tertiary Blade**: Additional details can stack further right

**Blade Controls:**
- **← Back**: Return to previous view
- **✕ Close**: Close current blade
- **⟲ Refresh**: Reload blade content
- **⚙️ Settings**: Blade-specific options

#### Quick Actions
Available throughout the application:
- **Ctrl/Cmd + K**: Open quick search
- **Ctrl/Cmd + N**: Create new item (context-dependent)
- **Ctrl/Cmd + R**: Refresh current view
- **Esc**: Close current blade or modal

---

## Profile Management

### 11. User Profile

#### Accessing Your Profile
1. Click your **profile picture** in the top-right corner
2. Select **"Profile"** from the dropdown menu

#### Profile Information
**Personal Details:**
- **Full Name**: Your display name throughout the application
- **Email Address**: Your login email and notification address
- **Job Title**: Your role in the organization
- **Department**: Your team or department
- **Phone Number**: Contact number (optional)

**Profile Picture:**
1. Click **"Change Picture"**
2. Upload an image (JPG, PNG, max 2MB)
3. Crop and adjust as needed
4. Click **"Save"**

#### Account Settings
**Password Management:**
1. Click **"Change Password"**
2. Enter your **current password**
3. Enter **new password** (min 8 characters)
4. Confirm **new password**
5. Click **"Update Password"**

**Two-Factor Authentication:**
1. Click **"Enable 2FA"**
2. Install authenticator app (Google Authenticator, Authy)
3. Scan the QR code
4. Enter verification code
5. Save backup codes in secure location

#### Activity History
View your recent activity:
- **Workflow Executions**: Workflows you've run
- **Data Operations**: Processing tasks you've initiated
- **System Access**: Login times and locations
- **Settings Changes**: Profile and configuration updates

### 12. Preferences

#### Display Preferences
- **Theme**: Light or Dark mode
- **Language**: Select your preferred language
- **Timezone**: Set your local timezone for accurate timestamps
- **Date Format**: Choose date display format (MM/DD/YYYY, DD/MM/YYYY)
- **Number Format**: Set decimal and thousand separators

#### Notification Preferences
Configure when and how you receive notifications:

**Email Notifications:**
- ✅ Workflow completion
- ✅ Processing errors
- ✅ System maintenance alerts
- ✅ Weekly summary reports
- ❌ Marketing updates

**In-App Notifications:**
- ✅ Real-time status updates
- ✅ Error alerts
- ✅ Task assignments
- ❌ Non-critical system messages

**Frequency Settings:**
- **Immediate**: Get notified right away
- **Hourly Digest**: Batch notifications every hour
- **Daily Summary**: Once per day at preferred time
- **Weekly Summary**: Once per week on chosen day

---

## Settings Configuration

### 13. System Settings

#### Accessing Settings
1. Click **"Settings"** in the sidebar
2. Navigate through different settings tabs

#### General Settings
**Application Behavior:**
- **Default Landing Page**: Choose where you arrive after login
- **Session Timeout**: Set automatic logout time (15 min - 8 hours)
- **Auto-refresh Interval**: How often data updates (30s - 5 minutes)
- **Max Concurrent Operations**: Limit simultaneous processes

**Data Display:**
- **Grid Page Size**: Number of records per page (20, 50, 100, 200)
- **Time Format**: 12-hour or 24-hour display
- **Currency Symbol**: Default currency for monetary values
- **Decimal Precision**: Number of decimal places to show

#### Integration Settings
**Database Connections:**
1. Click **"+ Add Connection"**
2. Choose database type (PostgreSQL, MySQL, SQL Server, Oracle)
3. Enter connection details:
   - **Host**: Database server address
   - **Port**: Database port (usually 5432 for PostgreSQL)
   - **Database Name**: Target database
   - **Username** and **Password**: Authentication credentials
4. Test connection and save

**API Endpoints:**
1. Click **"+ Add API Endpoint"**
2. Configure endpoint details:
   - **Name**: Descriptive name for the endpoint
   - **URL**: Full API endpoint URL
   - **Method**: GET, POST, PUT, DELETE
   - **Authentication**: None, API Key, Bearer Token, Basic Auth
   - **Headers**: Any required HTTP headers
3. Test endpoint and save

#### Security Settings
**Access Control:**
- **Role-Based Permissions**: Assign user roles and permissions
- **IP Restrictions**: Limit access to specific IP addresses
- **Session Security**: Configure session encryption and validation
- **Audit Logging**: Enable detailed access and change logging

**Data Protection:**
- **Encryption**: Enable data encryption at rest and in transit
- **Data Retention**: Set automatic data cleanup policies
- **Backup Configuration**: Schedule automatic backups
- **Compliance Settings**: Configure GDPR, HIPAA, or other compliance requirements

### 14. Team Management

#### User Roles
**Administrator:**
- Full system access
- User management
- System configuration
- Security settings

**Power User:**
- Create and manage workflows
- Access all data processing features
- View all reports and analytics
- Limited system configuration

**Standard User:**
- Run existing workflows
- View assigned data
- Basic reporting features
- Profile management only

**Read-Only User:**
- View workflows and data
- Access reports
- No modification capabilities
- Profile viewing only

#### Managing Team Members
1. Go to **Settings** → **Team Management**
2. Click **"+ Invite User"**
3. Enter user details:
   - **Email Address**: User's work email
   - **Full Name**: User's display name
   - **Role**: Select appropriate role
   - **Permissions**: Fine-tune specific permissions
4. Click **"Send Invitation"**

The user will receive an email invitation to create their account.

---

## Monitoring and Analytics

### 15. Performance Dashboard

#### Accessing Analytics
1. Click **"Analytics"** in the sidebar
2. Choose from available dashboard views:
   - **System Overview**: Overall performance metrics
   - **Workflow Analytics**: Execution statistics and trends
   - **Data Quality**: Processing accuracy and completeness
   - **User Activity**: Team usage patterns and productivity

#### Key Performance Indicators (KPIs)

**System Performance:**
- **Response Time**: Average API response time (target: <500ms)
- **Throughput**: Operations completed per hour
- **Error Rate**: Percentage of failed operations (target: <2%)
- **Uptime**: System availability percentage (target: >99.9%)

**Data Processing:**
- **Processing Speed**: Records processed per minute
- **Data Quality Score**: Percentage of valid/clean data
- **Storage Usage**: Current data storage consumption
- **Workflow Success Rate**: Percentage of successful workflow runs

#### Custom Reports
1. Click **"+ Create Report"**
2. Select report type:
   - **Trend Analysis**: Track metrics over time
   - **Comparison Report**: Compare different time periods
   - **User Activity Report**: Individual or team performance
   - **Data Quality Report**: Accuracy and completeness metrics
3. Configure report parameters:
   - **Time Range**: Select date range for analysis
   - **Filters**: Narrow down data by specific criteria
   - **Metrics**: Choose which KPIs to include
   - **Grouping**: Organize data by user, workflow, or time period
4. Click **"Generate Report"**

#### Exporting Data
1. From any analytics view, click **"Export"**
2. Choose export format:
   - **PDF**: For presentations and printing
   - **Excel**: For further analysis in spreadsheets
   - **CSV**: For importing into other systems
   - **JSON**: For programmatic access
3. Select data range and filters
4. Click **"Download"**

### 16. Real-time Monitoring

#### Live Status Board
The status board shows real-time system information:
- **Active Workflows**: Currently running processes
- **Queue Status**: Pending operations waiting to start
- **System Health**: CPU, memory, and network usage
- **Recent Errors**: Latest issues requiring attention

#### Alert Management
**Setting Up Alerts:**
1. Go to **Settings** → **Alerts**
2. Click **"+ New Alert Rule"**
3. Configure alert conditions:
   - **Metric**: Choose what to monitor (error rate, response time, etc.)
   - **Threshold**: Set the value that triggers the alert
   - **Duration**: How long the condition must persist
   - **Severity**: Critical, Warning, or Info level
4. Set notification preferences:
   - **Email Recipients**: Who should be notified
   - **Notification Timing**: Immediate or batched
   - **Escalation**: Additional notifications if not acknowledged
5. Click **"Create Alert"**

**Managing Active Alerts:**
- **Acknowledge**: Mark alert as seen and being handled
- **Snooze**: Temporarily silence alert for specified time
- **Resolve**: Mark the underlying issue as fixed
- **Escalate**: Forward to higher-level support

---

## Troubleshooting

### 17. Common Issues and Solutions

#### Login Problems
**Issue**: Can't log in with correct credentials
**Solutions:**
1. Check if Caps Lock is enabled
2. Clear browser cookies and cache
3. Try incognito/private browsing mode
4. Reset password using "Forgot Password" link
5. Check with administrator for account status

**Issue**: Two-factor authentication code not working
**Solutions:**
1. Ensure phone/app time is synchronized
2. Try the previous or next code in sequence
3. Use backup codes if available
4. Contact administrator to reset 2FA

#### Performance Issues
**Issue**: Application loading slowly
**Solutions:**
1. Check internet connection speed
2. Close other browser tabs and applications
3. Clear browser cache and cookies
4. Disable browser extensions temporarily
5. Try a different browser
6. Check system status page for known issues

**Issue**: Workflow execution taking too long
**Solutions:**
1. Check data source availability and performance
2. Reduce data set size for testing
3. Review processing configuration for efficiency
4. Monitor system resource usage
5. Contact administrator if resources are constrained

#### Data Issues
**Issue**: Missing data in workflow results
**Solutions:**
1. Check source data availability and permissions
2. Review data filtering and transformation rules
3. Verify date ranges and criteria settings
4. Check for data source connectivity issues
5. Review processing logs for errors or warnings

**Issue**: Incorrect calculation results
**Solutions:**
1. Verify input data accuracy and completeness
2. Review calculation formulas and business rules
3. Check for data type mismatches
4. Test with smaller, known data sets
5. Review processing stage configurations

#### Browser Compatibility
**Supported Browsers:**
- ✅ Chrome 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (Not supported)

**Browser Settings:**
- Enable JavaScript
- Allow cookies from the application domain
- Disable ad blockers for the application
- Enable local storage

### 18. Getting Help

#### Built-in Help System
1. Click the **"?"** icon in any interface
2. Hover over any field or button for tooltips
3. Use the **Help** menu in the top navigation
4. Access context-sensitive help in each section

#### Documentation Access
- **User Manual**: Complete application guide (this document)
- **API Documentation**: Technical integration details
- **Video Tutorials**: Step-by-step visual guides
- **FAQ**: Frequently asked questions and answers

#### Support Channels
**Self-Service Options:**
1. **Knowledge Base**: Search for solutions to common issues
2. **Community Forum**: Ask questions and share experiences
3. **Status Page**: Check for system outages and maintenance
4. **Release Notes**: Learn about new features and bug fixes

**Direct Support:**
1. **Help Desk Ticket**: Submit detailed issue reports
2. **Live Chat**: Real-time assistance during business hours
3. **Phone Support**: Critical issues and urgent requests
4. **Email Support**: Non-urgent questions and requests

#### Creating Effective Support Requests
**Include This Information:**
- **User Account**: Your username/email
- **Browser and Version**: Chrome 120, Firefox 119, etc.
- **Operating System**: Windows 11, macOS 14, Ubuntu 22.04
- **Error Messages**: Exact text of any error messages
- **Steps to Reproduce**: What you were doing when the issue occurred
- **Screenshots**: Visual evidence of the problem
- **Expected Behavior**: What should have happened
- **Actual Behavior**: What actually happened

**Example Good Support Request:**
```
Subject: Workflow WR-1234 fails during normalization stage

Environment:
- User: john.doe@company.com
- Browser: Chrome 120.0.6099.71
- OS: Windows 11 Pro

Issue Description:
Workflow WR-1234 consistently fails during the normalization stage 
with error "Data validation failed: Invalid date format in column 'created_at'"

Steps to Reproduce:
1. Navigate to Workflows page
2. Click "Run" on workflow "Daily Sales Import"
3. Workflow starts successfully
4. Fails after ~2 minutes during normalization

Expected: Workflow should complete successfully as it has for the past month
Actual: Fails with date format error

Additional Info:
- This started happening after yesterday's data source update
- Sample data shows dates in format "2024-01-15T10:30:00Z"
- Previous successful runs used format "2024/01/15 10:30:00"

Screenshots attached showing error message and sample data.
```

---

## Keyboard Shortcuts

### 19. Global Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + K` | Quick Search | Open global search dialog |
| `Ctrl/Cmd + N` | New Item | Create new workflow/task (context-dependent) |
| `Ctrl/Cmd + R` | Refresh | Reload current view |
| `Ctrl/Cmd + S` | Save | Save current form or settings |
| `Ctrl/Cmd + Z` | Undo | Undo last action (where applicable) |
| `Ctrl/Cmd + Y` | Redo | Redo last undone action |
| `Ctrl/Cmd + F` | Find | Open find dialog in current view |
| `Esc` | Close/Cancel | Close modal, blade, or cancel operation |
| `Tab` | Next Field | Move to next form field |
| `Shift + Tab` | Previous Field | Move to previous form field |
| `Enter` | Submit/Confirm | Submit form or confirm action |
| `Space` | Select/Toggle | Select item or toggle checkbox |

### 20. Navigation Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Alt + 1` | Dashboard | Go to main dashboard |
| `Alt + 2` | Workflows | Go to workflows page |
| `Alt + 3` | Data Processing | Go to data processing section |
| `Alt + 4` | Analytics | Go to analytics dashboard |
| `Alt + 5` | Settings | Go to settings page |
| `Ctrl/Cmd + B` | Toggle Sidebar | Show/hide left navigation |
| `Ctrl/Cmd + [` | Previous Blade | Go back in blade navigation |
| `Ctrl/Cmd + ]` | Next Blade | Go forward in blade navigation |
| `Alt + ←` | Back | Browser back (previous page) |
| `Alt + →` | Forward | Browser forward (next page) |

### 21. Grid and Data Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `↑` / `↓` | Navigate Rows | Move up/down in data grids |
| `←` / `→` | Navigate Columns | Move left/right in data grids |
| `Page Up` | Previous Page | Go to previous page of results |
| `Page Down` | Next Page | Go to next page of results |
| `Home` | First Row | Go to first row in current page |
| `End` | Last Row | Go to last row in current page |
| `Ctrl/Cmd + A` | Select All | Select all visible items |
| `Ctrl/Cmd + Click` | Multi-Select | Add/remove item from selection |
| `Shift + Click` | Range Select | Select range of items |
| `Delete` | Delete Selected | Delete selected items (with confirmation) |
| `F2` | Edit Mode | Enter edit mode for selected cell |
| `F5` | Refresh Data | Reload grid data |

### 22. Workflow Shortcuts
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl/Cmd + E` | Execute | Run selected workflow |
| `Ctrl/Cmd + P` | Pause | Pause running workflow |
| `Ctrl/Cmd + X` | Stop | Stop running workflow |
| `Ctrl/Cmd + L` | View Log | Open execution log |
| `Ctrl/Cmd + D` | Duplicate | Duplicate selected workflow |
| `Ctrl/Cmd + Del` | Delete | Delete selected workflow |
| `F9` | Quick Run | Run workflow with default settings |
| `Shift + F9` | Test Run | Run workflow in test mode |

### 23. Customizing Shortcuts
1. Go to **Settings** → **Keyboard Shortcuts**
2. Find the action you want to modify
3. Click in the **Shortcut** field
4. Press your desired key combination
5. Click **"Save"** to apply changes

**Notes:**
- Some shortcuts may conflict with browser shortcuts
- Custom shortcuts are saved per user account
- Reset to defaults option available in settings
- Some shortcuts may not work in all contexts

---

## Quick Reference Card

### Essential Actions
- **Search Everything**: `Ctrl/Cmd + K`
- **Create New**: `Ctrl/Cmd + N`
- **Run Workflow**: `Ctrl/Cmd + E`
- **Open Settings**: `Alt + 5`
- **Get Help**: `F1` or click `?` icon

### Status Icons Guide
- ✅ **Completed**: Operation finished successfully
- ⏳ **Running**: Operation in progress
- ⏸️ **Paused**: Operation temporarily stopped
- ❌ **Failed**: Operation encountered an error
- ⏱️ **Queued**: Operation waiting to start
- 🔄 **Retrying**: Operation attempting to recover from error

### Data Quality Indicators
- **🟢 Excellent** (95-100%): Data is high quality
- **🟡 Good** (85-94%): Minor quality issues
- **🟠 Fair** (70-84%): Notable quality concerns
- **🔴 Poor** (<70%): Significant quality problems

This comprehensive user manual provides step-by-step guidance for all aspects of the Mind Hillmetric application, from basic navigation to advanced features, ensuring users can effectively utilize all system capabilities.