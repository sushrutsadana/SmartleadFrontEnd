import { Box, VStack, Button, Text, Divider, Heading } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <Box
      w="280px"
      h="100vh"
      bgGradient="linear(to-b, #00838F, #2B3990)"
      p={6}
      position="relative"
      boxShadow="lg"
    >
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading 
            size="lg" 
            color="white" 
            fontFamily="Poppins"
            fontWeight="600"
            letterSpacing="tight"
          >
            SmartLead
            <Text as="span" fontSize="md" opacity={0.8}> CRM</Text>
          </Heading>
          <Text 
            fontSize="sm" 
            color="white"
            fontWeight="500" 
            mt={1}
            opacity={0.9}
          >
            AI-Driven Lead Mastery
          </Text>
        </Box>
        
        <Divider opacity={0.1} />
        
        <VStack spacing={3}>
          <Link to="/database" style={{ width: '100%' }}>
            <Button 
              w="full" 
              variant={isActive('/database') ? 'solid' : 'ghost'}
              leftIcon={<DatabaseIcon />}
              size="lg"
              bg={isActive('/database') ? 'white' : 'transparent'}
              color={isActive('/database') ? 'brand.blue' : 'white'}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
            >
              Database
            </Button>
          </Link>
          
          <Link to="/emails" style={{ width: '100%' }}>
            <Button 
              w="full" 
              variant={isActive('/emails') ? 'solid' : 'ghost'}
              size="lg"
              bg={isActive('/emails') ? 'white' : 'transparent'}
              color={isActive('/emails') ? 'brand.blue' : 'white'}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
            >
              Check Emails
            </Button>
          </Link>
          
          <Link to="/calls" style={{ width: '100%' }}>
            <Button 
              w="full" 
              variant={isActive('/calls') ? 'solid' : 'ghost'}
              size="lg"
              bg={isActive('/calls') ? 'white' : 'transparent'}
              color={isActive('/calls') ? 'brand.blue' : 'white'}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
            >
              Make Call
            </Button>
          </Link>
          
          <Link to="/leads/new" style={{ width: '100%' }}>
            <Button 
              w="full" 
              variant={isActive('/leads/new') ? 'solid' : 'ghost'}
              size="lg"
              bg={isActive('/leads/new') ? 'white' : 'transparent'}
              color={isActive('/leads/new') ? 'brand.blue' : 'white'}
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
            >
              Create Lead
            </Button>
          </Link>
        </VStack>
      </VStack>
    </Box>
  )
}

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  </svg>
)

export default Sidebar 