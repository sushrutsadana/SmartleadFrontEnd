import { useState, useEffect } from 'react'
import { Box, Container, VStack, Heading, Button } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Database from './pages/Database'
import CheckEmails from './pages/CheckEmails'
import MakeCall from './pages/MakeCall'
import CreateLead from './pages/CreateLead'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function App() {
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
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null // or a loading spinner
  }

  return (
    <ChakraProvider theme={theme}>
      <Router>
        {!session ? (
          <Container maxW="container.sm" centerContent py={10}>
            <Card p={8} w="full" maxW="400px">
              <Auth />
            </Card>
          </Container>
        ) : (
          <Container maxW="container.xl" p={4}>
            <Box borderWidth="1px" borderRadius="lg" p={6}>
              <VStack spacing={6} align="stretch">
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Heading size="lg">SmartLead CRM</Heading>
                  <Button 
                    onClick={() => supabase.auth.signOut()}
                    colorScheme="red"
                    size="sm"
                  >
                    Logout
                  </Button>
                </Box>
                
                <Routes>
                  <Route path="/" element={
                    <VStack spacing={6} align="stretch">
                      <Link to="/database">
                        <Button w="full" size="lg">Database</Button>
                      </Link>
                      
                      <Link to="/emails">
                        <Button w="full" size="lg">Check Emails</Button>
                      </Link>
                      
                      <Link to="/calls">
                        <Button w="full" size="lg">Make Call</Button>
                      </Link>
                      
                      <Link to="/leads/new">
                        <Button w="full" size="lg">Create Lead</Button>
                      </Link>
                    </VStack>
                  } />
                  <Route path="/database" element={<Database />} />
                  <Route path="/emails" element={<CheckEmails />} />
                  <Route path="/calls" element={<MakeCall />} />
                  <Route path="/leads/new" element={<CreateLead />} />
                </Routes>
              </VStack>
            </Box>
          </Container>
        )}
      </Router>
    </ChakraProvider>
  )
}

export default App 