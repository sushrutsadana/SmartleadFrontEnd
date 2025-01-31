import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <Flex h="100vh" bg="gray.50">
      <Sidebar />
      <Box flex="1" p={4} overflowY="auto">
        <Outlet />
      </Box>
    </Flex>
  )
}

export default Layout