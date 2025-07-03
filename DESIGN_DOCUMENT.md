# ED Dashboard - Comprehensive Design Document

## Table of Contents
1. [High-Level Design](#high-level-design)
2. [Low-Level Design](#low-level-design)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Frontend Architecture](#frontend-architecture)
6. [Security Design](#security-design)
7. [Deployment Architecture](#deployment-architecture)

---

## High-Level Design

### 1. System Overview
The HR Dashboard is a comprehensive enterprise management system designed for CDAC (Centre for Development of Advanced Computing) to manage various organizational modules including HR, Finance, Technical Projects, Business Development, MMG (Materials Management Group), and Administrative functions.

### 2. Architecture Pattern
- **Frontend**: React-based Single Page Application (SPA)
- **Backend**: Node.js with Express.js REST API
- **Database**: PostgreSQL with proper indexing and relationships
- **Authentication**: JWT-based token authentication
- **Authorization**: Role-based access control (RBAC)

### 3. System Modules

#### 3.1 Core Modules
1. **Authentication & Authorization**
   - User login/logout
   - Role-based access control
   - Password management

2. **HR Management**
   - Employee management
   - Bulk employee upload
   - Group assignment
   - Designation management
   - Technical groups
   - Employee services (attrition, promotions, transfers)

3. **Finance Management**
   - Project budget management
   - Expenditure tracking
   - Grant received management
   - Financial reporting

4. **Technical Projects**
   - Project management
   - Patents management
   - Publications tracking
   - Events management
   - PI/COPI assignments

5. **Business Development**
   - Client management
   - Business entities
   - Agreements management
   - Purchase orders
   - Revenue tracking

6. **MMG (Materials Management Group)**
   - Procurement management
   - Bidding process
   - Purchase order management
   - Vendor management

7. **Administrative**
   - Vehicle management
   - AMC (Annual Maintenance Contract) management
   - Contractor management
   - Staff management

8. **ED Office**
   - Calendar events
   - Travel management
   - Talks management
   - Dashboard views

### 4. System Characteristics
- **Scalability**: Modular architecture allows easy scaling
- **Maintainability**: Clean separation of concerns
- **Security**: JWT authentication with role-based access
- **Performance**: Optimized database queries with proper indexing
- **Usability**: Modern React UI with Material-UI components

---

## Low-Level Design

### 1. Database Schema Design

#### 1.1 Core Tables
```sql
-- Users and Authentication
users (user_id, username, password_hash, role, created_at)
migration_history (id, migration_name, executed_at)

-- HR Module
hr_employees (employee_id, employee_name, join_date, designation_id, 
             technical_group_id, status, gender, level, centre, 
             employee_type, initial_designation_id)
hr_designations (designation_id, designation, designation_full, level)
technical_groups (group_id, group_name, group_description)
hr_employee_promotions (id, employee_id, designation_id, effective_from_date, 
                       effective_to_date, level, remarks)
hr_employee_group_changes (id, employee_id, technical_group_id, 
                          effective_from_date, effective_to_date, remarks)
hr_employee_attrition (id, employee_id, attrition_date, attrition_type, remarks)

-- Finance Module
finance_projects (project_id, project_name, start_date, end_date, 
                 total_value, funding_agency, duration_years)
budget_fields (field_id, field_name, is_default)
project_budget_entries (entry_id, project_id, field_id, year_number, amount)
project_expenditure_entries (entry_id, project_id, field_id, year_number, amount)
grant_received (grant_id, project_id, amount, received_date, remarks)

-- Technical Module
patents (patent_id, patent_title, filing_date, application_number, 
         status, group_id, created_by)
patent_inventors (patent_id, employee_id)
patent_status_history (id, patent_id, old_status, new_status, update_date)
proposals (proposal_id, proposal_title, proposal_type, submitted_by, 
           submission_date, status, group_id)
project_publications (publication_id, project_id, type, title, details, 
                     publication_date, authors, group_id)
project_events (event_id, project_id, group_id, event_type, title, 
               start_date, end_date, participants_count, venue)

-- Business Development Module
clients (id, client_name, contact_person, email, address, "Contact No", description)
business_entities (id, entity_type, name, client_id, start_date, end_date, 
                  order_value, description, service_type)
projects_bd (id, entity_id, extended_date)
products_bd (id, entity_id)
services_bd (id, entity_id)
entity_payments (id, entity_id, amount, payment_date, status, billing_start_date, 
                billing_end_date)
purchase_orders (id, entity_id, po_number, po_date, amount, status, created_at)

-- MMG Module
procurements (id, indent_number, title, project_id, indentor_id, group_id, 
              purchase_type, delivery_place, status, estimated_cost, 
              sourcing_method, indent_date, mmg_acceptance_date)
procurement_items (id, procurement_id, item_name, specifications, quantity)
procurement_bids (id, procurement_id, tender_number, bids_received_count, 
                 finalized_vendor, notes, bid_amount)
procurement_history (id, procurement_id, old_status, new_status, status_date, remarks)

-- Administrative Module
vehicles (vehicle_id, vehicle_number, vehicle_type, model, year, 
         insurance_expiry, fitness_expiry, permit_expiry)
vehicle_servicing (id, vehicle_id, service_date, service_type, cost, remarks)
vehicle_insurance (id, vehicle_id, insurance_date, insurance_type, cost, remarks)
amc_contracts (contract_id, contract_name, vendor_name, start_date, end_date, 
              contract_value, status)
contractors (contractor_id, contractor_name, contact_person, email, phone, address)
admin_contractors (id, contractor_id, designation_id, join_date, status)

-- ED Office Module
calendar_events (event_id, title, description, start_date, end_date, 
                event_type, venue, organizer, ed_attendance_status, 
                ed_attendance_remarks)
travels (id, travel_type, location, onward_date, return_date, purpose, 
        accommodation, remarks)
talks (talk_id, title, speaker, talk_date, talk_type, venue, description)

-- ACTS Module
acts_courses (course_id, course_name, course_type, start_date, end_date, 
             participants_count, revenue, venue, instructor)
```

#### 1.2 Key Relationships
- **One-to-Many**: Employee → Promotions, Employee → Group Changes
- **Many-to-Many**: Patents ↔ Employees (Inventors), Projects ↔ Publications
- **Hierarchical**: Designations (levels), Technical Groups
- **Temporal**: Employee history tracking with effective dates

### 2. API Design

#### 2.1 Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/change-password
GET /api/auth/profile
```

#### 2.2 HR Endpoints
```
GET /api/hr/employees
POST /api/hr/employees
PUT /api/hr/employees/:id
DELETE /api/hr/employees/:id
POST /api/hr/bulk-upload
GET /api/hr/employees-without-groups
POST /api/hr/assign-groups
GET /api/hr/designations
GET /api/hr/technical-groups
GET /api/hr/services/attrition
POST /api/hr/services/attrition
GET /api/hr/services/promotions
POST /api/hr/services/promotions
GET /api/hr/services/transfers
POST /api/hr/services/transfers
```

#### 2.3 Finance Endpoints
```
GET /api/finance/projects
POST /api/finance/projects
GET /api/finance/budget-fields
GET /api/finance/expenditure
POST /api/finance/expenditure
GET /api/finance/grant-received
POST /api/finance/grant-received
```

#### 2.4 Technical Endpoints
```
GET /api/technical/patents
POST /api/technical/patents
GET /api/technical/proposals
POST /api/technical/proposals
GET /api/technical/publications
POST /api/technical/publications
GET /api/technical/events
POST /api/technical/events
```

#### 2.5 Business Development Endpoints
```
GET /api/business/clients
POST /api/business/clients
GET /api/business/entities
POST /api/business/entities
GET /api/business/agreements
POST /api/business/agreements
GET /api/business/purchase-orders
POST /api/business/purchase-orders
```

#### 2.6 MMG Endpoints
```
GET /api/mmg/procurements
POST /api/mmg/procurements
GET /api/mmg/bids
POST /api/mmg/bids
GET /api/mmg/purchase-orders
POST /api/mmg/purchase-orders
```

### 3. Frontend Architecture

#### 3.1 Component Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Navigation.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── Common/
│   │   ├── ErrorNotification.tsx
│   │   └── IconWrapper.tsx
├── pages/
│   ├── hr/
│   │   ├── Employees.tsx
│   │   ├── EmployeeBulkUpload.tsx
│   │   ├── GroupManagement.tsx
│   │   └── services/
│   ├── finance/
│   ├── technical/
│   ├── business/
│   ├── mmg/
│   ├── admin/
│   └── edoffice/
├── services/
│   ├── api.ts
│   └── [module]/
├── contexts/
│   └── AuthContext.tsx
├── types/
└── utils/
```

#### 3.2 State Management
- **React Context**: Authentication state
- **Local State**: Component-specific state
- **API State**: Managed through custom hooks and axios

#### 3.3 Routing
- **Protected Routes**: Role-based access control
- **Nested Routes**: Module-specific routing
- **Dynamic Routes**: ID-based resource access

### 4. Security Design

#### 4.1 Authentication
- **JWT Tokens**: Stateless authentication
- **Token Refresh**: Automatic token renewal
- **Secure Storage**: HTTP-only cookies for production

#### 4.2 Authorization
- **Role-Based Access**: User roles determine module access
- **Route Protection**: Frontend and backend route guards
- **API Authorization**: Middleware-based permission checks

#### 4.3 Data Security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content Security Policy
- **CSRF Protection**: Token-based CSRF protection

### 5. Performance Optimization

#### 5.1 Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient JOIN operations
- **Connection Pooling**: Database connection management

#### 5.2 Frontend Optimization
- **Code Splitting**: Lazy loading of modules
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Optimization**: Tree shaking and minification

#### 5.3 API Optimization
- **Pagination**: Large dataset handling
- **Caching**: Redis-based caching for frequently accessed data
- **Compression**: Gzip compression for API responses

### 6. Error Handling

#### 6.1 Frontend Error Handling
- **Global Error Boundary**: Catches unhandled errors
- **API Error Handling**: Consistent error response format
- **User Feedback**: Toast notifications for user actions

#### 6.2 Backend Error Handling
- **Middleware**: Centralized error handling
- **Validation**: Input validation with detailed error messages
- **Logging**: Structured logging for debugging

### 7. Testing Strategy

#### 7.1 Frontend Testing
- **Unit Tests**: Component testing with Jest and React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: User workflow testing

#### 7.2 Backend Testing
- **Unit Tests**: Function and service testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Migration and data integrity testing

### 8. Deployment Architecture

#### 8.1 Development Environment
- **Local Development**: Docker Compose setup
- **Hot Reloading**: Development server with auto-reload
- **Environment Variables**: Configuration management

#### 8.2 Production Environment
- **Containerization**: Docker-based deployment
- **Load Balancing**: Nginx reverse proxy
- **Database**: Managed PostgreSQL service
- **Monitoring**: Application performance monitoring

### 9. Data Migration Strategy

#### 9.1 Migration System
- **Versioned Migrations**: Sequential migration files
- **Rollback Support**: Migration history tracking
- **Data Validation**: Post-migration data integrity checks

#### 9.2 Backup Strategy
- **Automated Backups**: Daily database backups
- **Point-in-Time Recovery**: Transaction log backups
- **Disaster Recovery**: Multi-region backup storage

---

## Conclusion

The HR Dashboard system is designed as a comprehensive, scalable, and maintainable enterprise application. The modular architecture allows for easy extension and modification of individual components without affecting the entire system. The security-first approach ensures data protection and user privacy, while the performance optimizations provide a smooth user experience even with large datasets.

The system successfully addresses the complex requirements of managing multiple organizational modules while maintaining data integrity, security, and performance standards expected in enterprise environments. 