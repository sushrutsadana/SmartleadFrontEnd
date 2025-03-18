import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Database from './pages/Database'
import CheckEmails from './pages/CheckEmails'
import CreateLead from './pages/CreateLead'
import MakeCall from './pages/MakeCall'
import LeadCard from './pages/LeadCard'
import SendEmails from './pages/SendEmails'
import SendWhatsApp from './pages/SendWhatsApp'
import SearchWhatsApp from './pages/SearchWhatsApp'
import Auth from './components/Auth'
import SearchSocial from './pages/SearchSocial'
import Admin from './pages/Admin'
import Meetings from './pages/Meetings'
import Reports from './pages/Reports'
import GmailCallback from './pages/GmailCallback'

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Auth />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
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
        path: '/lead/:id',
        element: <LeadCard />,
      },
      {
        path: '/send-emails',
        element: <SendEmails />
      },
      {
        path: '/send-whatsapp',
        element: <SendWhatsApp />
      },
      {
        path: '/whatsapp',
        element: <SearchWhatsApp />
      },
      {
        path: '/social',
        element: <SearchSocial />
      },
      {
        path: '/admin',
        element: <Admin />
      },
      {
        path: '/meetings',
        element: <Meetings />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        path: '/admin/gmail-callback',
        element: <GmailCallback />
      }
    ]
  }
]) 