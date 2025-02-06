import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerContent, DrawerOverlay, Text } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import SearchBar from './SearchBar'
import { FiMenu } from 'react-icons/fi'
import { brandColors, spacing } from '../theme/constants'
import RecentLeads from './RecentLeads'

function Layout() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Flex h="100vh" bg={brandColors.background.light}>
      {/* Desktop Sidebar */}
      <Box
        as="nav"
        pos="fixed"
        left="0"
        w={spacing.layout.sidebarWidth}
        h="100%"
        display={{ base: 'none', lg: 'block' }}
      >
        <Sidebar />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <Sidebar isMobile onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Mobile menu button */}
      <IconButton
        icon={<FiMenu />}
        onClick={onOpen}
        variant="ghost"
        position="fixed"
        left={4}
        top={4}
        display={{ base: 'flex', lg: 'none' }}
        zIndex={20}
      />

      {/* Main Content Area */}
      <Box 
        flex="1" 
        ml={{ base: 0, lg: spacing.layout.sidebarWidth }}
        maxW={{ base: '100vw', lg: `calc(100vw - ${spacing.layout.sidebarWidth} - 300px)` }}
        position="relative"
      >
        {/* Top SearchBar */}
        <Box 
          position="sticky"
          top={0}
          zIndex={10}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <SearchBar />
        </Box>

        {/* Page Content */}
        <Box 
          flex="1"
          px={{ base: 4, md: 6, lg: 8 }}
          py={6}
          maxW="1800px"
          w="100%"
        >
          <Outlet />
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
          <Box maxW="1800px" mx="auto">
            <Text color="gray.500" fontSize="sm">
              © 2025 SmartLead CRM. All rights reserved.
            </Text>
          </Box>
        </Box>
      </Box>

      {/* RecentLeads Sidebar */}
      <Box 
        display={{ base: 'none', lg: 'block' }}
        w="300px"
        borderLeft="1px solid"
        borderColor="gray.200"
        bg="white"
        h="100vh"
        overflowY="auto"
      >
        <RecentLeads />
      </Box>
    </Flex>
  )
}

export default Layout