# ED Dashboard - Comprehensive Design Documents

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

The ED Dashboard is a comprehensive enterprise management system designed for CDAC (Centre for Development of Advanced Computing) to manage various organizational modules under the Executive Director's purview.

### 2. System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/TS)    │◄──►│  (Node.js/TS)   │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐            ┌─────▼─────┐            ┌────▼────┐
    │  Auth   │            │   API     │            │  Tables │
    │  MUI    │            │  Routes   │            │ Migrations│
    │ Router  │            │ Middleware│            │  Views   │
    └─────────┘            └───────────┘            └─────────┘
```

### 3. Module Architecture

The system is organized into 7 main modules:

```
ED Dashboard
├── Admin Module
│   ├── Contractor Management
│   ├── Staff Management
│   ├── Vehicle Management
│   ├── AMC Contract Management
│   └── Department Management
├── HR Module
│   ├── Employee Management
│   ├── Bulk Employee Upload
│   ├── Group Assignment
│   ├── Promotions & Transfers
│   ├── Training Management
│   └── Recruitment
├── Finance Module
│   ├── Project Budget Management
│   ├── Expenditure Tracking
│   ├── Grant Management
│   └── Financial Reports
├── Business Development Module
│   ├── Client Management
│   ├── Project Management
│   ├── Service Management
│   ├── Agreement Management
│   └── Purchase Orders
├── Technical Module
│   ├── Technical Groups
│   ├── Patent Management
│   ├── Proposal Management
│   ├── Publications
│   └── Project Events
├── MMG Module
│   ├── Procurement Management
│   ├── Bidding Process
│   ├── Purchase Orders
│   └── Vendor Management
└── ACTS Module
    ├── Course Management
    ├── Revenue Tracking
    └── Training Programs
```

### 4. User Roles & Permissions

```
Executive Director (ED)
├── Full access to all modules
├── Dashboard overview
└── Strategic decision making

Module Heads
├── Access to specific modules
├── Module-specific dashboards
└── Operational management

HR Manager
├── HR module access
├── Employee management
└── Group assignments

Finance Manager
├── Finance module access
├── Budget management
└── Financial reporting

Technical Lead
├── Technical module access
├── Patent management
└── Group management

Business Manager
├── Business module access
├── Client management
└── Project tracking

MMG Manager
├── MMG module access
├── Procurement management
└── Vendor coordination
```

---

## Low-Level Design

### 1. Backend Architecture

#### 1.1 Directory Structure
```
backend/
├── src/
│   ├── db/
│   │   ├── migrations/          # Database migrations
│   │   ├── db.ts               # Database connection
│   │   └── index.ts            # Database utilities
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   └── roles.ts            # Role-based access control
│   ├── routes/
│   │   ├── admin/              # Admin module routes
│   │   ├── hr/                 # HR module routes
│   │   ├── finance/            # Finance module routes
│   │   ├── business/           # Business module routes
│   │   ├── technical/          # Technical module routes
│   │   ├── mmg/                # MMG module routes
│   │   ├── acts/               # ACTS module routes
│   │   └── edoffice/           # ED Office routes
│   ├── services/               # Business logic
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Utility functions
├── package.json
└── tsconfig.json
```

#### 1.2 API Structure
```
/api
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── GET /profile
├── /admin
│   ├── /contractors
│   ├── /staff
│   ├── /vehicles
│   └── /amc
├── /hr
│   ├── /employees
│   ├── /bulk-upload
│   ├── /group-assignment
│   ├── /promotions
│   └── /training
├── /finance
│   ├── /projects
│   ├── /budget
│   ├── /expenditure
│   └── /grants
├── /business
│   ├── /clients
│   ├── /projects
│   ├── /services
│   └── /agreements
├── /technical
│   ├── /groups
│   ├── /patents
│   ├── /proposals
│   └── /publications
├── /mmg
│   ├── /procurements
│   ├── /bids
│   └── /purchase-orders
└── /acts
    ├── /courses
    └── /revenue
```

### 2. Frontend Architecture

#### 2.1 Directory Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx
│   │   ├── Navigation.tsx
│   │   ├── Sidebar.tsx
│   │   └── PageHeader.tsx
│   ├── pages/
│   │   ├── admin/              # Admin module pages
│   │   ├── hr/                 # HR module pages
│   │   ├── finance/            # Finance module pages
│   │   ├── business/           # Business module pages
│   │   ├── technical/          # Technical module pages
│   │   ├── mmg/                # MMG module pages
│   │   ├── acts/               # ACTS module pages
│   │   └── ed/                 # ED Office pages
│   ├── services/
│   │   ├── api.ts              # API client
│   │   └── edoffice/           # ED Office services
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Utility functions
├── public/
└── package.json
```

#### 2.2 Component Hierarchy
```
App
├── AuthContext
├── Router
│   ├── Login
│   ├── DashboardLayout
│   │   ├── Navigation
│   │   ├── Sidebar
│   │   └── Content
│   │       ├── Admin Pages
│   │       ├── HR Pages
│   │       ├── Finance Pages
│   │       ├── Business Pages
│   │       ├── Technical Pages
│   │       ├── MMG Pages
│   │       └── ACTS Pages
│   └── Profile
└── ErrorBoundary
```

---

## Database Design

### 1. Core Tables

#### 1.1 User Management
```sql
-- Users table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

#### 1.2 HR Module Tables
```sql
-- Employees
CREATE TABLE hr_employees (
    employee_id INTEGER PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    designation_id INTEGER REFERENCES hr_designations(designation_id),
    technical_group_id INTEGER REFERENCES technical_groups(group_id),
    status VARCHAR(20) DEFAULT 'active',
    gender VARCHAR(2) CHECK (gender IN ('M', 'F', 'T')),
    level INTEGER,
    centre VARCHAR(10),
    employee_type VARCHAR(50),
    initial_designation_id INTEGER REFERENCES hr_designations(designation_id)
);

-- Designations
CREATE TABLE hr_designations (
    designation_id SERIAL PRIMARY KEY,
    designation VARCHAR(100) NOT NULL,
    designation_full VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL
);

-- Technical Groups
CREATE TABLE technical_groups (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    group_description TEXT
);
```

#### 1.3 Finance Module Tables
```sql
-- Finance Projects
CREATE TABLE finance_projects (
    project_id SERIAL PRIMARY KEY,
    project_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_value NUMERIC(15, 2) NOT NULL,
    funding_agency TEXT NOT NULL,
    duration_years INTEGER NOT NULL
);

-- Budget Fields
CREATE TABLE budget_fields (
    field_id SERIAL PRIMARY KEY,
    field_name TEXT NOT NULL UNIQUE,
    is_default BOOLEAN DEFAULT FALSE
);

-- Project Budget Entries
CREATE TABLE project_budget_entries (
    entry_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES finance_projects(project_id),
    field_id INTEGER REFERENCES budget_fields(field_id),
    year_number INTEGER NOT NULL,
    amount NUMERIC(15, 2) NOT NULL
);
```

#### 1.4 Business Module Tables
```sql
-- Clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    "Contact No" VARCHAR(10)
);

-- Business Entities
CREATE TABLE business_entities (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('project', 'product', 'service')),
    name VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    start_date DATE,
    end_date DATE,
    order_value DECIMAL(15,2)
);
```

#### 1.5 Technical Module Tables
```sql
-- Patents
CREATE TABLE patents (
    patent_id SERIAL PRIMARY KEY,
    patent_title VARCHAR(500) NOT NULL,
    filing_date DATE NOT NULL,
    application_number VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    group_id INTEGER REFERENCES technical_groups(group_id)
);

-- Proposals
CREATE TABLE proposals (
    proposal_id SERIAL PRIMARY KEY,
    proposal_title VARCHAR(500) NOT NULL,
    proposal_type VARCHAR(50) NOT NULL,
    submitted_by INTEGER REFERENCES hr_employees(employee_id),
    submission_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    group_id INTEGER REFERENCES technical_groups(group_id)
);
```

#### 1.6 MMG Module Tables
```sql
-- Procurements
CREATE TABLE procurements (
    id SERIAL PRIMARY KEY,
    indent_number VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    indentor_id INTEGER REFERENCES hr_employees(employee_id),
    group_id INTEGER REFERENCES technical_groups(group_id),
    purchase_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending Approval',
    estimated_cost DECIMAL(15,2)
);

-- Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    procurement_id INTEGER REFERENCES procurements(id),
    vendor_name VARCHAR(255) NOT NULL,
    order_value DECIMAL(15,2) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending'
);
```

#### 1.7 ACTS Module Tables
```sql
-- ACTS Courses
CREATE TABLE acts_courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    revenue DECIMAL(15,2)
);
```

### 2. Relationship Diagram

```
Users (1) ──── (N) User_Sessions
Users (1) ──── (N) HR_Employees

HR_Employees (N) ──── (1) HR_Designations
HR_Employees (N) ──── (1) Technical_Groups

Finance_Projects (1) ──── (N) Project_Budget_Entries
Budget_Fields (1) ──── (N) Project_Budget_Entries

Clients (1) ──── (N) Business_Entities
Business_Entities (1) ──── (N) Entity_Payments

Technical_Groups (1) ──── (N) Patents
Technical_Groups (1) ──── (N) Proposals

HR_Employees (1) ──── (N) Procurements
Technical_Groups (1) ──── (N) Procurements
Procurements (1) ──── (N) Purchase_Orders
```

---

## API Design

### 1. Authentication APIs

#### 1.1 Login
```typescript
POST /api/auth/login
Request:
{
  username: string;
  password: string;
}

Response:
{
  token: string;
  user: {
    user_id: number;
    username: string;
    role: string;
  };
}
```

#### 1.2 Logout
```typescript
POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { message: string }
```

### 2. HR Module APIs

#### 2.1 Employee Management
```typescript
// Get all employees
GET /api/hr/employees
Headers: Authorization: Bearer <token>
Response: Employee[]

// Create employee
POST /api/hr/employees
Headers: Authorization: Bearer <token>
Body: EmployeeData

// Update employee
PUT /api/hr/employees/:id
Headers: Authorization: Bearer <token>
Body: EmployeeData

// Bulk upload employees
POST /api/hr/bulk-upload
Headers: Authorization: Bearer <token>
Body: FormData (Excel file)
```

#### 2.2 Group Assignment
```typescript
// Get employees without groups
GET /api/hr/employees-without-groups
Headers: Authorization: Bearer <token>

// Assign group to employee
PUT /api/hr/employees/:id/group
Headers: Authorization: Bearer <token>
Body: { technical_group_id: number }
```

### 3. Finance Module APIs

#### 3.1 Project Management
```typescript
// Get all projects
GET /api/finance/projects
Headers: Authorization: Bearer <token>

// Create project
POST /api/finance/projects
Headers: Authorization: Bearer <token>
Body: ProjectData

// Get project budget
GET /api/finance/projects/:id/budget
Headers: Authorization: Bearer <token>
```

### 4. Business Module APIs

#### 4.1 Client Management
```typescript
// Get all clients
GET /api/business/clients
Headers: Authorization: Bearer <token>

// Create client
POST /api/business/clients
Headers: Authorization: Bearer <token>
Body: ClientData
```

### 5. Technical Module APIs

#### 5.1 Patent Management
```typescript
// Get all patents
GET /api/technical/patents
Headers: Authorization: Bearer <token>

// Create patent
POST /api/technical/patents
Headers: Authorization: Bearer <token>
Body: PatentData
```

### 6. MMG Module APIs

#### 6.1 Procurement Management
```typescript
// Get all procurements
GET /api/mmg/procurements
Headers: Authorization: Bearer <token>

// Create procurement
POST /api/mmg/procurements
Headers: Authorization: Bearer <token>
Body: ProcurementData
```

---

## Frontend Architecture

### 1. Component Design Patterns

#### 1.1 Layout Components
```typescript
// DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Navigation />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
```

#### 1.2 Data Management
```typescript
// API Service Pattern
class APIService {
  private baseURL: string;
  private token: string;

  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('token') || '';
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### 2. State Management

#### 2.1 Context API for Authentication
```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string) => {
    // Login logic
  };

  const logout = () => {
    // Logout logic
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Routing Strategy

#### 3.1 Protected Routes
```typescript
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

---

## Security Design

### 1. Authentication & Authorization

#### 1.1 JWT Token Management
```typescript
// JWT Structure
interface JWTPayload {
  user_id: number;
  username: string;
  role: string;
  exp: number;
  iat: number;
}

// Token Validation Middleware
const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as JWTPayload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### 1.2 Role-Based Access Control
```typescript
// Role Middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### 2. Data Validation

#### 2.1 Input Validation
```typescript
// Validation Schemas
const employeeSchema = Joi.object({
  employee_id: Joi.number().required(),
  employee_name: Joi.string().min(2).max(255).required(),
  join_date: Joi.date().required(),
  designation_id: Joi.number().required(),
  gender: Joi.string().valid('M', 'F', 'T').required(),
  level: Joi.number().min(1).max(10),
  centre: Joi.string().valid('KP', 'EC1', 'EC2').required()
});
```

### 3. SQL Injection Prevention

#### 3.1 Parameterized Queries
```typescript
// Safe Query Execution
const getEmployeeById = async (employeeId: number): Promise<Employee> => {
  const query = 'SELECT * FROM hr_employees WHERE employee_id = $1';
  const result = await pool.query(query, [employeeId]);
  return result.rows[0];
};
```

---

## Deployment Architecture

### 1. Development Environment

#### 1.1 Local Development Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start

# Database
docker run -d \
  --name postgres-dashboard \
  -e POSTGRES_DB=dashboard \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:13
```

#### 1.2 Environment Configuration
```env
# Backend .env
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard
JWT_SECRET=your-secret-key
NODE_ENV=development

# Frontend .env
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Production Deployment

#### 2.1 Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]

# Frontend Dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
```

#### 2.2 Docker Compose
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: dashboard
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: dashboard
      DB_USER: postgres
      DB_PASSWORD: password
      JWT_SECRET: your-secret-key
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 3. Monitoring & Logging

#### 3.1 Application Logging
```typescript
// Winston Logger Configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### 3.2 Health Checks
```typescript
// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});
```

---

## Performance Considerations

### 1. Database Optimization

#### 1.1 Indexing Strategy
```sql
-- Performance Indexes
CREATE INDEX idx_hr_employees_employee_id ON hr_employees(employee_id);
CREATE INDEX idx_hr_employees_designation_id ON hr_employees(designation_id);
CREATE INDEX idx_hr_employees_technical_group_id ON hr_employees(technical_group_id);
CREATE INDEX idx_finance_projects_start_date ON finance_projects(start_date);
CREATE INDEX idx_business_entities_client_id ON business_entities(client_id);
```

#### 1.2 Query Optimization
```sql
-- Optimized Queries with Joins
SELECT 
  e.employee_id,
  e.employee_name,
  d.designation_full,
  tg.group_name
FROM hr_employees e
LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
LEFT JOIN technical_groups tg ON e.technical_group_id = tg.group_id
WHERE e.status = 'active';
```

### 2. Frontend Performance

#### 2.1 Code Splitting
```typescript
// Lazy Loading Components
const HRModule = lazy(() => import('./pages/hr/HRModule'));
const FinanceModule = lazy(() => import('./pages/finance/FinanceModule'));
const BusinessModule = lazy(() => import('./pages/business/BusinessModule'));

// Route-based code splitting
<Route 
  path="/hr/*" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <HRModule />
    </Suspense>
  } 
/>
```

#### 2.2 Caching Strategy
```typescript
// API Response Caching
const useCachedData = <T>(key: string, fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    } else {
      fetcher().then(result => {
        setData(result);
        sessionStorage.setItem(key, JSON.stringify(result));
        setLoading(false);
      });
    }
  }, [key, fetcher]);

  return { data, loading };
};
```

---

## Testing Strategy

### 1. Backend Testing

#### 1.1 Unit Tests
```typescript
// Employee Service Tests
describe('EmployeeService', () => {
  it('should create employee successfully', async () => {
    const employeeData = {
      employee_id: 12345,
      employee_name: 'John Doe',
      join_date: '2023-01-01',
      designation_id: 1,
      gender: 'M',
      centre: 'KP'
    };

    const result = await employeeService.createEmployee(employeeData);
    expect(result.employee_id).toBe(12345);
  });
});
```

#### 1.2 Integration Tests
```typescript
// API Integration Tests
describe('HR API', () => {
  it('should return employees list', async () => {
    const response = await request(app)
      .get('/api/hr/employees')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### 2. Frontend Testing

#### 2.1 Component Tests
```typescript
// Component Testing
describe('EmployeeList', () => {
  it('should render employee list', () => {
    const employees = [
      { employee_id: 1, employee_name: 'John Doe' }
    ];

    render(<EmployeeList employees={employees} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

---

## Conclusion

This ED Dashboard system provides a comprehensive solution for managing CDAC's organizational modules under the Executive Director's oversight. The system is designed with scalability, security, and maintainability in mind, using modern web technologies and best practices.

Key features include:
- Multi-module architecture supporting Admin, HR, Finance, Business, Technical, MMG, and ACTS modules
- Role-based access control with JWT authentication
- Responsive React frontend with Material-UI
- RESTful API backend with Node.js and Express
- PostgreSQL database with proper indexing and relationships
- Comprehensive testing strategy
- Docker-based deployment configuration

The system is ready for production deployment and can be extended with additional modules as organizational needs evolve. 