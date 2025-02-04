import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient'
import { Card, Container, Box, Text, Flex } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function AuthComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <Flex minH="50vh" align="center">
      <Container maxW="container.sm" centerContent>
        <Box mb={8}>
          <Text 
            fontSize="3xl" 
            fontWeight="bold"
            bgGradient="linear(to-r, #00838F, #2B3990)"
            bgClip="text"
            textAlign="center"
          >
            SmartLead CRM
          </Text>
          <Text 
            fontSize="sm" 
            color="gray.600"
            textAlign="left"  // Left align the tagline
            pl={1}  // Small padding to align with the text above
          >
            AI-Driven Lead Mastery
          </Text>
        </Box>
        <Card p={8} w="full" maxW="400px">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#00838F',
                    brandAccent: '#2B3990'
                  }
                }
              }
            }}
            providers={[]}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
          />
        </Card>
      </Container>
    </Flex>
  )
}