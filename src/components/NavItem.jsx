import { Box, HStack, Icon, Text } from '@chakra-ui/react'
import { Link, useLocation } from 'react-router-dom'

function NavItem({ icon, label, path, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === path

  return (
    <Link to={path} onClick={onClick}>
      <Box
        px={6}
        py={3}
        cursor="pointer"
        _hover={{
          bg: 'whiteAlpha.200',
          transform: 'translateX(4px)',
        }}
        transition="all 0.2s"
        bg={isActive ? 'whiteAlpha.200' : 'transparent'}
      >
        <HStack spacing={4}>
          <Icon as={icon} boxSize={5} />
          <Text>{label}</Text>
        </HStack>
      </Box>
    </Link>
  )
}

export default NavItem 