import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'

function Layout() {
  return (
    <Flex h="100vh" bg="brand.background">
      <Sidebar />
      <SearchBar />
      <Box 
        flex="1" 
        ml="280px"
        p={6} 
        pt={24}
        overflowY="auto"
        bgGradient="brand.gradient.sidebar"
        position="relative"
      >
        <Box mt={4}>
          <Outlet />
        </Box>
      </Box>
    </Flex>
  )
}

export default Layout