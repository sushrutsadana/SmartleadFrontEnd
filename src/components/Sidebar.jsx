import { Box, VStack, Button, Text } from '@chakra-ui/react'
import { FiLogOut } from 'react-icons/fi'
import NavItem from './NavItem'
import { supabase } from '../supabaseClient'
import { navigationItems } from '../config/navigation'

function Sidebar({ isMobile, onClose }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <Box
      w="full"
      h="100vh"
      bgGradient="linear(to-b, #00838F, #2B3990)"
      color="white"
      py={6}
      overflowY="auto"
      position="relative"
    >
      {/* Logo */}
      <Box px={6} mb={8}>
        <Text fontSize="xl" fontWeight="bold">
          SmartLead CRM
        </Text>
        <Text fontSize="sm" opacity={0.8}>
          AI-Driven Lead Mastery
        </Text>
      </Box>

      {/* Navigation Items */}
      <VStack align="stretch" spacing={8}>
        {/* Dashboard */}
        <Box>
          {navigationItems.main.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </Box>

        {/* Find New Leads Section */}
        <Box>
          <Text px={6} fontSize="sm" fontWeight="medium" mb={2} opacity={0.7}>
            FIND NEW LEADS
          </Text>
          {navigationItems.findNewLeads.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </Box>

        {/* Convert Leads Section */}
        <Box>
          <Text px={6} fontSize="sm" fontWeight="medium" mb={2} opacity={0.7}>
            CONVERT LEADS
          </Text>
          {navigationItems.convertLeads.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </Box>

        {/* Other Links */}
        <Box>
          {navigationItems.other.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              path={item.path}
              label={item.label}
              onClick={isMobile ? onClose : undefined}
            />
          ))}
        </Box>
      </VStack>

      {/* Logout Button at Bottom */}
      <Box mt="auto" px={4}>
        <Button
          w="full"
          size="lg"
          onClick={handleLogout}
          leftIcon={<FiLogOut />}
          bg="red.100"
          color="red.600"
          _hover={{ 
            bg: "red.200",
            transform: "scale(1.02)",
            shadow: "md"
          }}
          _active={{
            bg: "red.300"
          }}
          transition="all 0.2s"
          fontWeight="600"
        >
          Logout
        </Button>
      </Box>
    </Box>
  )
}

export default Sidebar