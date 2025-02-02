import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <Flex h="100vh" bg="brand.background">
      <Sidebar />
      <Box 
        flex="1" 
        p={6} 
        overflowY="auto"
        bgGradient="brand.gradient.sidebar"
        position="relative"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          height="200px"
          bgGradient="linear(to-b, #00838F05, transparent)"
          pointerEvents="none"
        />
        <Outlet />
      </Box>
    </Flex>
  )
}

export default Layout