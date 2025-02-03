import { Box, Flex, useDisclosure, IconButton, Drawer, DrawerContent, DrawerOverlay } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import { FiMenu } from 'react-icons/fi'

function Layout() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex h="100vh" bg="brand.background">
      {/* Mobile menu button */}
      <IconButton
        display={{ base: "flex", lg: "none" }}
        onClick={onOpen}
        variant="ghost"
        position="fixed"
        top={4}
        left={4}
        zIndex={20}
        icon={<FiMenu size={24} />}
        aria-label="Open Menu"
      />

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar isMobile onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Desktop Sidebar */}
      <Box
        display={{ base: "none", lg: "block" }}
        w="280px"
      >
        <Sidebar />
      </Box>

      {/* Main Content Area */}
      <Box 
        flex="1" 
        ml={{ base: 0, lg: "280px" }}
        position="relative"
      >
        {/* SearchBar */}
        <SearchBar />
        
        {/* Content */}
        <Box 
          p={6} 
          pt={{ base: 24, lg: 24 }}
          overflowY="auto"
          bgGradient="brand.gradient.sidebar"
          minH="100vh"
        >
          <Box mt={4}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Flex>
  )
}

export default Layout