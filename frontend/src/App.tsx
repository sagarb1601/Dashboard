import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import BudgetFields from './pages/finance/BudgetFields';
import Projects from './pages/finance/Projects';
import FinanceHome from './pages/finance/FinanceHome';
import Expenditure from './pages/finance/Expenditure';
import GrantReceived from './pages/finance/GrantReceived';
import YearlyBudget from './pages/finance/YearlyBudget';
import ChangePassword from './pages/ChangePassword';
import ContractorsPage from './pages/admin/contractors';
import ContractorMappings from './pages/admin/contractors/ContractorMappings';
import StaffPage from './pages/admin/staff/StaffPage';
import AMC from './pages/admin/amc/AMC';
import VehiclesPage from './pages/admin/vehicles/VehiclesPage';
import Welcome from './pages/Welcome';
import Courses from './pages/acts/Courses';
import Employees from './pages/hr/Employees';
import Services from './pages/hr/services/Services';
import Training from './pages/hr/Training';
import Recruitment from './pages/hr/Recruitment';
import Manpower from './pages/hr/Manpower';
import ClientsPage from './pages/business/Clients';
import BusinessEntitiesPage from './pages/business/BusinessEntities';
import PurchaseOrdersPage from './pages/business/PurchaseOrders';
import ServiceDetailsPage from './pages/business/ServiceDetails';
import TechnicalGroupMappingPage from './pages/business/TechnicalGroupMapping';
import Products from './pages/business/Products';
import { ConfigProvider } from 'antd';
import './index.css';
import BDServices from './pages/business/BDServices';
import BDProjects from './pages/business/BDProjects';
// Technical Group imports
import GroupProjects from './pages/technical/GroupProjects';
import ProjectStatus from './pages/technical/ProjectStatus';
import Events from './pages/technical/Events';
import Publications from './pages/technical/Publications';
import PiCopi from './pages/technical/PiCopi'; 
import Agreements from './pages/business/Agreements';
import SlaFunds from './pages/business/SlaFunds';


interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string;
  allowedRoles?: string[];
}

// Helper function to get user's home path based on role/group
export const getUserHomePath = (role: string): string => {
  if (!role) return '/login';
  
  const roleLower = role.toLowerCase();
  console.log('Getting home path for role:', roleLower);
  
  switch (roleLower) {
    case 'finance': return '/finance';
    case 'hr': return '/hr/employees';
    case 'admin': return '/admin/contractors';
    case 'acts': return '/acts/courses';
    case 'bd': return '/business/clients';
    case 'tg': return '/technical/project-status';
    default: return '/welcome';
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase();

  console.log('Protected Route Check:', {
    token: !!token,
    userRole,
    requireRole: requireRole?.toLowerCase(),
    allowedRoles,
    user
  });

  if (!token) {
    console.log('No token found, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Check if the route requires specific role
  if (requireRole && userRole !== requireRole.toLowerCase()) {
    console.log('Unauthorized access, redirecting to home path:', userRole);
    return <Navigate to={getUserHomePath(userRole)} />;
  }

  // Check if the route is allowed for the user
  if (allowedRoles && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
    console.log('Unauthorized access, redirecting to home path:', userRole);
    return <Navigate to={getUserHomePath(userRole)} />;
  }

  return <>{children}</>;
};

// Route to handle already logged-in users
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('Public Route Check:', {
    token: !!token,
    user
  });

  if (token && user.role) {
    const homePath = getUserHomePath(user.role);
    console.log('User already logged in, redirecting to:', homePath);
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ConfigProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/unauthorized" element={
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Unauthorized Access</h1>
                <p>You do not have permission to access this area.</p>
              </div>
            } />

            {/* Finance routes */}
            <Route path="/finance/home" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <FinanceHome />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/finance" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <Projects />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/finance/budget" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <BudgetFields />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/finance/yearly-budget" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <YearlyBudget />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/finance/expenditure" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <Expenditure />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/finance/grant-received" element={
              <ProtectedRoute requireRole="finance">
                {/* <DashboardLayout> */}
                  <GrantReceived />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />

            {/* Routes for other user types */}
            <Route path="/hr" element={
              <ProtectedRoute requireRole="hr">
                <Navigate to="/hr/employees" replace />
              </ProtectedRoute>
            } />
            <Route path="/acts" element={
              <ProtectedRoute requireRole="acts">
                <Navigate to="/acts/courses" replace />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireRole="admin">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/mmg" element={
              <ProtectedRoute requireRole="mmg">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/bd" element={
              <ProtectedRoute requireRole="bd">
                <Navigate to="/business/clients" replace />
              </ProtectedRoute>
            } />
            <Route path="/soulware" element={
              <ProtectedRoute requireRole="soulware">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/asia" element={
              <ProtectedRoute requireRole="asia">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/rise" element={
              <ProtectedRoute requireRole="rise">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/trust" element={
              <ProtectedRoute requireRole="trust">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/hpc" element={
              <ProtectedRoute requireRole="hpc">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/qutech" element={
              <ProtectedRoute requireRole="qutech">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/edoffice" element={
              <ProtectedRoute requireRole="edoffice">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/vlsi" element={
              <ProtectedRoute requireRole="vlsi">
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Common routes */}
            <Route path="/change-password" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ChangePassword />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/contractors" element={
              <ProtectedRoute requireRole="admin">
                <DashboardLayout>
                  <ContractorsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/contractors/:contractorId/mappings" element={
              <ProtectedRoute requireRole="admin">
                <DashboardLayout>
                  <ContractorMappings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/staff" element={
              <ProtectedRoute requireRole="admin">
                <DashboardLayout>
                  <StaffPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/amc" element={
              <ProtectedRoute requireRole="admin">
                <DashboardLayout>
                  <AMC />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/vehicles" element={
              <ProtectedRoute requireRole="admin">
                <DashboardLayout>
                  <VehiclesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Regular user route */}
            <Route path="/welcome" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Welcome />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Root redirect */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to={getUserHomePath(userRole)} replace />
              </ProtectedRoute>
            } />

            {/* HR routes */}
            <Route path="/hr/employees" element={
              <ProtectedRoute requireRole="hr">
                <DashboardLayout>
                  <Employees />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* HR Training route */}
            <Route path="/hr/training" element={
              <ProtectedRoute requireRole="hr">
                <DashboardLayout>
                  <Training />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* HR Recruitment route */}
            <Route path="/hr/recruitment" element={
              <ProtectedRoute requireRole="hr">
                <DashboardLayout>
                  <Recruitment />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* HR Manpower route */}
            <Route path="/hr/manpower" element={
              <ProtectedRoute requireRole="hr">
                <DashboardLayout>
                  <Manpower />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* ACTS routes */}
            <Route path="/acts/courses" element={
              <ProtectedRoute requireRole="acts">
                <DashboardLayout>
                  <Courses />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* HR services route */}
            <Route path="/hr/services" element={
              <ProtectedRoute requireRole="hr">
                <DashboardLayout>
                  <Services />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Business Module Routes */}
            <Route path="/business" element={
              <ProtectedRoute requireRole="bd">
                <Navigate to="/business/clients" replace />
              </ProtectedRoute>
            } />
            <Route path="/business/entities" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <BusinessEntitiesPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/clients" element={
              <ProtectedRoute requireRole="bd">
                {/* <DashboardLayout> */}
                  <ClientsPage />
                {/* </DashboardLayout> */}
              </ProtectedRoute>
            } />
            <Route path="/business/purchase-orders" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <PurchaseOrdersPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/service-details" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <ServiceDetailsPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/technical-groups" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <TechnicalGroupMappingPage />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/products" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <Products />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/projects" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <BDProjects />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/services" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <BDServices />
                </DashboardLayout>
              </ProtectedRoute>
            } />  
            <Route path="/business/agreements" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <Agreements />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/business/sla-funds" element={
              <ProtectedRoute requireRole="bd">
                <DashboardLayout>
                  <SlaFunds />
                </DashboardLayout>
              </ProtectedRoute>
            } />

{/* Technical Group routes */}
<Route path="/technical/projects" element={
              <ProtectedRoute requireRole="tg">
                <DashboardLayout>
                  <GroupProjects />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/technical" element={
              <ProtectedRoute requireRole="tg">
                <Navigate to="/technical/projects" replace />
              </ProtectedRoute>
            } />
            <Route path="/technical/project-status" element={
              <ProtectedRoute requireRole="tg">
                <DashboardLayout>
                  <ProjectStatus />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/technical/events" element={
              <ProtectedRoute requireRole="tg">
                <DashboardLayout>
                  <Events />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/technical/publications" element={
              <ProtectedRoute requireRole="tg">
                <DashboardLayout>
                  <Publications />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/technical/pi-copi" element={
              <ProtectedRoute requireRole="tg">
                <DashboardLayout>
                  <PiCopi />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Redirect all other routes to user's home path */}
            <Route path="*" element={
              <Navigate to="/" />
            } />
          </Routes>
        </Router>
      </ConfigProvider>
    </LocalizationProvider>
  );
};

export default App;
