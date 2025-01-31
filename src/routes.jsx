import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Database from './pages/Database'
import CheckEmails from './pages/CheckEmails'
import MakeCall from './pages/MakeCall'
import CreateLead from './pages/CreateLead'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Database />,
      },
      {
        path: "/database",
        element: <Database />,
      },
      {
        path: "/emails",
        element: <CheckEmails />,
      },
      {
        path: "/calls",
        element: <MakeCall />,
      },
      {
        path: "/leads/new",
        element: <CreateLead />,
      },
    ],
  },
]) 