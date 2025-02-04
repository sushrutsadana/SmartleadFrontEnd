import {
  Box,
  VStack,
  Text,
  Button,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiInstagram, FiTwitter, FiFacebook, FiLinkedin, FiLock } from 'react-icons/fi'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function SearchSocial() {
  const platforms = [
    { name: 'Instagram', icon: FiInstagram, color: '#E1306C' },
    { name: 'Facebook', icon: FiFacebook, color: '#4267B2' },
    { name: 'X (Twitter)', icon: FiTwitter, color: '#14171A' },
    { name: 'LinkedIn', icon: FiLinkedin, color: '#0077B5' },
  ]

  const bgHover = useColorModeValue('gray.50', 'gray.700')

  return (
    <PageContainer>
      <PageHeader
        title="Social Media Monitoring"
        description="Connect your social media accounts to monitor DMs for incoming leads"
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} p={6}>
        {platforms.map((platform) => (
          <Card
            key={platform.name}
            p={6}
            _hover={{ bg: bgHover }}
            transition="all 0.2s"
          >
            <VStack spacing={4} align="stretch">
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Icon 
                  as={platform.icon} 
                  boxSize={8} 
                  color={platform.color}
                />
                <Icon as={FiLock} color="gray.500" />
              </Box>
              <Text fontWeight="bold" fontSize="lg">
                {platform.name}
              </Text>
              <Text color="gray.600">
                Monitor {platform.name} direct messages for potential leads and automatically create lead profiles.
              </Text>
              <Button 
                isDisabled
                onClick={() => {}}
                size="sm"
              >
                Connect Account
              </Button>
            </VStack>
          </Card>
        ))}
      </SimpleGrid>

      <Card mx={6} p={6} bg="blue.50">
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color="blue.800">
            🔒 Account Connection Required
          </Text>
          <Text color="blue.600">
            To enable social media monitoring, please contact your administrator to connect your organization's social media accounts. 
            This feature requires proper authentication and permissions setup.
          </Text>
          <Button
            colorScheme="blue"
            size="sm"
            width="fit-content"
            onClick={() => window.location.href = 'mailto:smartleadplatform@gmail.com'}
          >
            Contact Admin
          </Button>
        </VStack>
      </Card>
    </PageContainer>
  )
}

export default SearchSocial 