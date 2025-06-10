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
      }
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]); 