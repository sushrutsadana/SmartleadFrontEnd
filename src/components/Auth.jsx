import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient'
import { Card, Container, Box, Text, Flex, Image, VStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function AuthComponent() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {z
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
    <Flex minH="70vh" align="center">
      <Container maxW="container.sm" centerContent>
        <VStack spacing={1} mb={8}>
          <Image
            src="/logo.png"
            alt="SmartLead Logo"
            boxSize="48px"
            objectFit="contain"
            mb={2}
          />
          <Text 
            fontSize="2xl" 
            fontWeight="semibold"
            color="#00838F"
          >
            SmartLead CRM
          </Text>
          <Text 
            fontSize="sm" 
            color="gray.600"
            textAlign="left"
          >
            AI-Driven Lead Mastery
          </Text>
        </VStack>
        <Card 
          p={8} 
          w="full" 
          maxW="400px"
          boxShadow="sm"
          borderRadius="lg"
        >
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#00838F',
                    brandAccent: '#2B3990',
                    inputBackground: 'white',
                    inputBorder: '#E2E8F0',
                    inputBorderHover: '#CBD5E0',
                    inputBorderFocus: '#00838F',
                  },
                  radii: {
                    borderRadiusButton: '6px',
                    buttonBorderRadius: '6px',
                    inputBorderRadius: '6px',
                  },
                  space: {
                    inputPadding: '12px',
                    buttonPadding: '12px'
                  },
                  fonts: {
                    bodyFontFamily: `Poppins, sans-serif`,
                    buttonFontFamily: `Poppins, sans-serif`,
                    inputFontFamily: `Poppins, sans-serif`,
                  }
                },
                sign_up: {
                  email_label: '',
                  password_label: '',
                  button_label: '',
                  link_text: ''
                }
              },
              style: {
                button: {
                  fontSize: '16px',
                  fontWeight: '500'
                },
                input: {
                  fontSize: '16px'
                },
                label: {
                  fontSize: '16px',
                  color: '#4A5568'
                },
                anchor: {
                  fontSize: '16px',
                  color: '#00838F'
                }
              }
            }}
            providers={[]}
            view="sign_in"
            localization={{
              variables: {
                sign_up: {
                  email_label: '',
                  password_label: '',
                  button_label: '',
                  link_text: ''
                }
              }
            }}
          />
          <Text 
    position="fixed"
    bottom="4"
    width="100%"
    textAlign="center"
    fontSize="sm"
    color="gray.500"
  >
    © 2025 SmartLead CRM. All rights reserved.
  </Text>
        </Card>
      </Container>
    </Flex>
  )
}