import { Box, VStack, Button, Heading } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar() {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <Box
      w="250px"
      h="100vh"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      p={4}
    >
      <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={6}>SmartLead CRM</Heading>
        
        <Link to="/database">
          <Button 
            w="full" 
            variant={isActive('/database') ? 'solid' : 'ghost'}
            colorScheme={isActive('/database') ? 'blue' : 'gray'}
          >
            Database
          </Button>
        </Link>
        
        <Link to="/emails">
          <Button 
            w="full" 
            variant={isActive('/emails') ? 'solid' : 'ghost'}
            colorScheme={isActive('/emails') ? 'blue' : 'gray'}
          >
            Check Emails
          </Button>
        </Link>
        
        <Link to="/calls">
          <Button 
            w="full" 
            variant={isActive('/calls') ? 'solid' : 'ghost'}
            colorScheme={isActive('/calls') ? 'blue' : 'gray'}
          >
            Make Call
          </Button>
        </Link>
        
        <Link to="/leads/new">
          <Button 
            w="full" 
            variant={isActive('/leads/new') ? 'solid' : 'ghost'}
            colorScheme={isActive('/leads/new') ? 'blue' : 'gray'}
          >
            Create Lead
          </Button>
        </Link>
      </VStack>
    </Box>
  )
}

export default Sidebar 