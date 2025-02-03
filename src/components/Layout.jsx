import { Box, Flex, useDisclosure, IconButton, Drawer, DrawerContent, DrawerOverlay, Text } from '@chakra-ui/react'
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
        display="flex"
        flexDirection="column"
        h="100vh"
        overflow="hidden"
      >
        {/* SearchBar */}
        <SearchBar />
        
        {/* Scrollable Content Area */}
        <Box 
          flex="1"
          overflowY="auto"
          pt={{ base: 24, lg: 24 }}
          pb={8}
          px={6}
          bgGradient="brand.gradient.sidebar"
        >
          <Box 
            maxW="1200px" 
            mx="auto"
            minH="calc(100vh - 180px)"
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
          >
            <Outlet />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          py={4}
          px={8}
          borderTop="1px"
          borderColor="gray.200"
          bg="white"
          w="full"
        >
          <Box maxW="1200px" mx="auto">
            <Text color="gray.500" fontSize="sm" textAlign="center">
              © 2025 SmartLead CRM. All rights reserved.
            </Text>
          </Box>
        </Box>
      </Box>
    </Flex>
  )
}

export default Layout