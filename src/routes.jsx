import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Database from './pages/Database'
import CheckEmails from './pages/CheckEmails'
import CreateLead from './pages/CreateLead'
import MakeCall from './pages/MakeCall'
import LeadCard from './pages/LeadCard'
import SendEmails from './pages/SendEmails'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/database',
        element: <Database />,
      },
      {
        path: '/emails',
        element: <CheckEmails />,
      },
      {
        path: '/leads/new',
        element: <CreateLead />,
      },
      {
        path: '/calls',
        element: <MakeCall />,
      },
      {
        path: '/leads/:id',
        element: <LeadCard />,
      },
      {
        path: '/send-emails',
        element: <SendEmails />
      },
    ],
  },
]) 