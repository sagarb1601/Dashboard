import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Profile from "../pages/Profile";
import Employees from "../pages/hr/Employees";
import Services from "../pages/hr/services/Services";
import Training from "../pages/hr/Training";
import Recruitment from "../pages/hr/Recruitment";
import Manpower from "../pages/hr/Manpower";
import EdofcFullCalendarPage from '../pages/edofc/EdofcFullCalendarPage';
import BusinessServices from '../pages/business/Services';
import Clients from '../pages/business/Clients';
import BusinessEntities from '../pages/business/BusinessEntities';
import Products from '../pages/business/Products';
import Projects from '../pages/business/Projects';
import PurchaseOrders from '../pages/business/PurchaseOrders';
import PurchaseOrderStatus from '../pages/business/PurchaseOrderStatus';
import ServiceDetails from '../pages/business/ServiceDetails';
import TechnicalGroupMapping from '../pages/business/TechnicalGroupMapping';
import Agreements from '../pages/business/Agreements';
import SlaFunds from '../pages/business/SlaFunds';
import BusinessDashboard from '../pages/business/BusinessDashboard';
import AdminDashboard from '../pages/ed/AdminDashboard';
import MMGDashboard from '../pages/ed/MMGDashboard';
import FinanceDashboard from '../pages/ed/FinanceDashboard';
import ACTSDashboard from '../pages/acts/ACTSDashboard';
import HRDashboard from '../pages/ed/HRDashboard';
import TechnicalDashboard from '../pages/ed/TechnicalDashboard';
import EdHomePage from '../pages/ed/EdHomePage';
import EdCalendarPage from '../pages/ed/EdCalendarPage';
import EdEventsPage from '../pages/ed/EdEventsPage';
import EdTravelListPage from '../pages/ed/EdTravelListPage';
import EdTravelCalendarPage from '../pages/ed/EdTravelCalendarPage';
import TravelViewPage from '../pages/ed/TravelViewPage';
import ACTSViewPage from '../pages/ed/ACTSViewPage';
import MMGViewPage from '../pages/ed/MMGViewPage';
import AdminViewPage from '../pages/ed/AdminViewPage';
import HRViewPage from '../pages/ed/HRViewPage';
import EmployeeBulkUpload from '../pages/hr/EmployeeBulkUpload';
import GroupAssignment from '../pages/hr/GroupAssignment';
import Courses from '../pages/acts/Courses';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/hr/employees",
        element: <Employees />,
      },
      {
        path: "/hr/services",
        element: <Services />,
      },
      {
        path: "/hr/training",
        element: <Training />,
      },
      {
        path: "/hr/recruitment",
        element: <Recruitment />,
      },
      {
        path: "/hr/manpower",
        element: <Manpower />,
      },
      {
        path: "/hr/bulk-upload",
        element: <EmployeeBulkUpload />,
      },
      {
        path: "/hr/group-assignment",
        element: <GroupAssignment />,
      },
      {
        path: '/edofc/full-calendar',
        element: <EdofcFullCalendarPage />,
      },
      {
        path: '/business/clients',
        element: <Clients />,
      },
      {
        path: '/business/entities',
        element: <BusinessEntities />,
      },
      {
        path: '/business/services',
        element: <BusinessServices />,
      },
      {
        path: '/business/products',
        element: <Products />,
      },
      {
        path: '/business/projects',
        element: <Projects />,
      },
      {
        path: '/business/purchase-orders',
        element: <PurchaseOrders />,
      },
      {
        path: '/business/purchase-order-status',
        element: <PurchaseOrderStatus />,
      },
      {
        path: '/business/service-details',
        element: <ServiceDetails />,
      },
      {
        path: '/business/technical-groups',
        element: <TechnicalGroupMapping />,
      },
      {
        path: '/business/agreements',
        element: <Agreements />,
      },
      {
        path: '/business/sla-funds',
        element: <SlaFunds />,
      },
      {
        path: '/ed/home',
        element: <EdHomePage />,
      },
      {
        path: '/ed/admin-dashboard',
        element: <AdminDashboard />,
      },
      {
        path: '/ed/mmg-dashboard',
        element: <MMGDashboard />,
      },
      {
        path: '/ed/finance-dashboard',
        element: <FinanceDashboard />,
      },
      {
        path: '/ed/acts-dashboard',
        element: <ACTSDashboard />,
      },
      {
        path: '/ed/hr-dashboard',
        element: <HRDashboard />,
      },
      {
        path: '/ed/technical-dashboard',
        element: <TechnicalDashboard />,
      },
      {
        path: '/ed/business-dashboard',
        element: <BusinessDashboard />,
      },
      {
        path: '/ed/calendar',
        element: <EdCalendarPage />,
      },
      {
        path: '/ed/events',
        element: <EdEventsPage />,
      },
      {
        path: '/ed/travel-list',
        element: <EdTravelListPage />,
      },
      {
        path: '/ed/travel-calendar',
        element: <EdTravelCalendarPage />,
      },
      {
        path: '/ed/travel-view',
        element: <TravelViewPage />,
      },
      {
        path: '/ed/acts-view',
        element: <ACTSViewPage />,
      },
      {
        path: '/ed/mmg-view',
        element: <MMGViewPage />,
      },
      {
        path: '/ed/admin-view',
        element: <AdminViewPage />,
      },
      {
        path: '/ed/hr-view',
        element: <HRViewPage />,
      },
      {
        path: '/acts/courses',
        element: <Courses />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]); 