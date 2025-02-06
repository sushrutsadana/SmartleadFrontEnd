import { 
  FiHome, 
  FiMail, 
  FiMessageSquare, 
  FiSearch, 
  FiPhone, 
  FiSend, 
  FiDatabase,
  FiSettings,
  FiCalendar
} from 'react-icons/fi'

export const navigationItems = {
  main: [
    {
      path: '/',
      icon: FiHome,
      label: 'Dashboard'
    }
  ],
  findNewLeads: [
    {
      path: '/emails',
      icon: FiMail,
      label: 'Search Emails'
    },
    {
      path: '/whatsapp',
      icon: FiMessageSquare,
      label: 'Search WhatsApp'
    },
    {
      path: '/social',
      icon: FiSearch,
      label: 'Search Social Media'
    }
  ],
  convertLeads: [
    {
      path: '/calls',
      icon: FiPhone,
      label: 'Make Calls'
    },
    {
      path: '/send-emails',
      icon: FiSend,
      label: 'Send Emails'
    },
    {
      path: '/send-whatsapp',
      icon: FiMessageSquare,
      label: 'Send WhatsApp'
    }
  ],
  other: [
    {
      path: '/meetings',
      icon: FiCalendar,
      label: 'Meetings'
    },
    {
      path: '/database',
      icon: FiDatabase,
      label: 'Database'
    },
    {
      path: '/admin',
      icon: FiSettings,
      label: 'Admin Settings'
    }
  ]
} 