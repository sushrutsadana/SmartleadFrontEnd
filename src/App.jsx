import { Box, Container, VStack, Heading, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

function App() {
  return (
    <Container maxW="container.xl" p={4}>
      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">SmartLead CRM</Heading>
          
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
      </Box>
    </Container>
  )
}

export default App 