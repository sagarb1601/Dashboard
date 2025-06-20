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
import EdofcCalendarPage from '../pages/edofc/EdofcCalendarPage';
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
        path: '/edofc/calendar',
        element: <EdofcCalendarPage />,
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
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]); 