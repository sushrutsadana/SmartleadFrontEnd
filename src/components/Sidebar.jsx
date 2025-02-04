import { Box, VStack, HStack, Text, Icon, Divider, Button, Flex } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, 
  FiMail, 
  FiMessageSquare, 
  FiPhone,
  FiDatabase,
  FiSearch,
  FiLogOut,
  FiSettings
} from 'react-icons/fi'
import { supabase } from '../supabaseClient'

const API_URL = import.meta.env.VITE_API_URL;

function Sidebar({ isMobile, onClose }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const NavItem = ({ icon, children, to }) => (
    <Link to={to} onClick={isMobile ? onClose : undefined}>
      <HStack
        px={4}
        py={3}
        spacing={3}
        borderRadius="lg"
        transition="all 0.2s"
        bg={isActive(to) ? 'whiteAlpha.200' : 'transparent'}
        color={isActive(to) ? 'white' : 'whiteAlpha.800'}
        _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
      >
        <Icon as={icon} boxSize={5} />
        <Text fontSize="sm" fontWeight="500">
          {children}
        </Text>
      </HStack>
    </Link>
  )

  const SectionTitle = ({ children }) => (
    <Text
      px={4}
      py={2}
      fontSize="xs"
      fontWeight="600"
      textTransform="uppercase"
      color="whiteAlpha.600"
      letterSpacing="wider"
    >
      {children}
    </Text>
  )

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
        <Text fontSize="2xl" fontWeight="bold">
          SmartLead CRM
        </Text>
        <Text fontSize="sm" color="whiteAlpha.700">
          AI-Driven Lead Mastery
        </Text>
      </Box>

      <VStack spacing={6} align="stretch" h="calc(100vh - 200px)">
        {/* Main Navigation */}
        <Box>
          <NavItem icon={FiHome} to="/dashboard">
            Dashboard
          </NavItem>
        </Box>

        <Divider borderColor="whiteAlpha.200" />

        {/* Find New Leads */}
        <Box>
          <SectionTitle>Find New Leads</SectionTitle>
          <VStack spacing={1} align="stretch">
            <NavItem icon={FiMail} to="/emails">
              Search Emails
            </NavItem>
            <NavItem icon={FiMessageSquare} to="/whatsapp">
              Search WhatsApp
            </NavItem>
            <NavItem icon={FiSearch} to="/social">
              Search Social Media
            </NavItem>
          </VStack>
        </Box>

        <Divider borderColor="whiteAlpha.200" />

        {/* Convert Leads Section */}
        <Box>
          <SectionTitle>Convert Leads</SectionTitle>
          <VStack spacing={1} align="stretch">
            <NavItem icon={FiPhone} to="/calls">
              Make Calls
            </NavItem>
            <NavItem icon={FiMail} to="/send-emails">
              Send Emails
            </NavItem>
            <NavItem icon={FiMessageSquare} to="/send-whatsapp">
              Send WhatsApp
            </NavItem>
          </VStack>
        </Box>

        <Divider borderColor="whiteAlpha.200" />

        {/* Database */}
        <Box>
          <NavItem icon={FiDatabase} to="/database">
            Database
          </NavItem>
        </Box>

        {/* Add Admin Section */}
        <Box>
          <NavItem icon={FiSettings} to="/admin">
            Admin Settings
          </NavItem>
        </Box>

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
      </VStack>
    </Box>
  )
}

export default Sidebar