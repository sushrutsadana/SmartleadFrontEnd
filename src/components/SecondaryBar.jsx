import { Box, VStack, Button, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'

function SecondaryBar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <Box
      w="280px"
      h="100vh"
      bg="white"
      borderLeft="1px"
      borderColor="gray.100"
      p={4}
      position="fixed"
      right={0}
      top={0}
      boxShadow="sm"
    >
      <VStack spacing={4} align="stretch">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="var(--chakra-colors-gray-400)" />
          </InputLeftElement>
          <Input 
            placeholder="Search leads..." 
            borderRadius="lg"
            borderColor="gray.200"
          />
        </InputGroup>

        <Link to="/leads/search">
          <Button
            w="full"
            variant="ghost"
            justifyContent="flex-start"
            bg={isActive('/leads/search') ? 'gray.50' : 'transparent'}
            _hover={{ bg: 'gray.50' }}
          >
            Search Lead
          </Button>
        </Link>

        <Link to="/leads/new">
          <Button
            w="full"
            variant="ghost"
            justifyContent="flex-start"
            bg={isActive('/leads/new') ? 'gray.50' : 'transparent'}
            _hover={{ bg: 'gray.50' }}
          >
            Create New Lead
          </Button>
        </Link>
      </VStack>
    </Box>
  )
}

export default SecondaryBar 