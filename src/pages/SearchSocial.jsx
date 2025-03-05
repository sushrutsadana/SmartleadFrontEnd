import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Divider,
  Avatar,
  Badge,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Image,
  Flex,
  IconButton,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react'
import { FiInstagram, FiTwitter, FiFacebook, FiLinkedin, FiLock, FiUser, FiMessageCircle, FiKey, FiUserCheck, FiCalendar, FiMapPin } from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { useNavigate } from 'react-router-dom'

function SearchSocial() {
  const [instagramMessages, setInstagramMessages] = useState([])
  const [facebookMessages, setFacebookMessages] = useState([])
  const [socialLeads, setSocialLeads] = useState([])
  const [socialActivities, setSocialActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch data on component mount
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch leads with social media sources
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('lead_source', ['instagram', 'meta', 'facebook'])
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError
      setSocialLeads(leadsData || [])

      // Fetch Instagram messages
      const { data: instaData, error: instaError } = await supabase
        .from('activities')
        .select('*, leads(*)')
        .eq('activity_type', 'instagram_message')
        .order('activity_datetime', { ascending: false })

      if (instaError) throw instaError
      
      // Fetch Facebook messages
      const { data: fbData, error: fbError } = await supabase
        .from('activities')
        .select('*, leads(*)')
        .eq('activity_type', 'messenger_message')
        .order('activity_datetime', { ascending: false })

      if (fbError) throw fbError
      
      // Format Instagram messages
      const formattedInstaMessages = instaData?.map(activity => {
        const lead = activity.leads || {}
        
        return {
          id: activity.id,
          lead_id: activity.lead_id,
          sender: {
            name: lead.first_name && lead.last_name 
              ? `${lead.first_name} ${lead.last_name}`
              : activity.sender_name || 'Unknown User',
            handle: lead.email || activity.sender_handle || '@unknown',
            avatar: 'https://via.placeholder.com/50',
            verified: activity.is_verified || false
          },
          message: activity.body || 'No message content',
          timestamp: activity.activity_datetime,
          read: activity.is_read || true
        }
      }) || []
      
      // Format Facebook messages
      const formattedFbMessages = fbData?.map(activity => {
        const lead = activity.leads || {}
        
        return {
          id: activity.id,
          lead_id: activity.lead_id,
          sender: {
            name: lead.first_name && lead.last_name 
              ? `${lead.first_name} ${lead.last_name}`
              : activity.sender_name || 'Unknown User',
            handle: lead.email || activity.sender_handle || '@unknown',
            avatar: 'https://via.placeholder.com/50',
            verified: activity.is_verified || false
          },
          message: activity.body || 'No message content',
          timestamp: activity.activity_datetime,
          read: activity.is_read || true
        }
      }) || []
      
      setInstagramMessages(formattedInstaMessages)
      setFacebookMessages(formattedFbMessages)
      setSocialActivities(instaData || fbData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error fetching data',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const createLeadFromMessage = async (message) => {
    // This would normally create a new lead or update existing lead
    // Since we're working with real data, we'll just navigate to the lead details
    if (message.lead_id) {
      navigate(`/lead/${message.lead_id}`)
      
      toast({
        title: 'Opening Lead',
        description: `Navigating to lead details`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'new': 'blue',
      'contacted': 'yellow',
      'qualified': 'green',
      'lost': 'red',
      'won': 'purple'
    }
    return colors[status?.toLowerCase()] || 'gray'
  }

  const viewLead = (id) => {
    navigate(`/lead/${id}`)
  }

  const MessageCard = ({ message, platform }) => {
    const isInstagram = platform.toLowerCase() === 'instagram'
    
    return (
      <Card mb={4}>
        <Box p={4}>
          <HStack mb={2}>
            <Avatar 
              size="sm" 
              name={message.sender.name}
              bg={isInstagram ? 'pink.400' : 'blue.400'}
            />
            <Box>
              <HStack>
                <Text fontWeight="bold">{message.sender.name}</Text>
                {message.sender.verified && (
                  <Badge colorScheme="blue" variant="subtle" fontSize="xs">VERIFIED</Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500">{message.sender.handle}</Text>
            </Box>
            {!message.read && (
              <Badge ml="auto" colorScheme="red" variant="solid" borderRadius="full">
                NEW
              </Badge>
            )}
          </HStack>
          
          <Text mb={3} fontSize="sm">
            {isInstagram ? 'First Instagram message received: ' : 'Facebook Messenger message received: '}
            {message.message}
          </Text>
          
          <HStack justify="space-between" align="center">
            <Text fontSize="xs" color="gray.500">
              <Icon as={FiCalendar} mr={1} />
              {formatTimestamp(message.timestamp)}
            </Text>
            
            <Button 
              size="sm" 
              leftIcon={<FiUser />}
              onClick={() => createLeadFromMessage(message)}
              colorScheme={isInstagram ? 'pink' : 'facebook'}
              variant="outline"
            >
              View Lead
            </Button>
          </HStack>
        </Box>
      </Card>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Social Media Monitoring"
        description="Connect your social media accounts to monitor DMs for incoming leads"
      />
      
      {loading ? (
        <Center h="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : (
        <>
          {/* Instagram and Facebook Columns */}
          <SimpleGrid columns={2} spacing={6} mb={8}>
            {/* Instagram Column */}
            <Card>
              <Box p={4} borderBottom="1px solid" borderColor="gray.100">
                <HStack>
                  <Icon as={FiInstagram} boxSize={6} color="pink.500" />
                  <Heading size="md">Instagram</Heading>
                </HStack>
              </Box>
              
              <Box p={4} maxH="500px" overflowY="auto">
                {instagramMessages.length > 0 ? (
                  instagramMessages.map(message => (
                    <MessageCard 
                      key={message.id} 
                      message={message} 
                      platform="Instagram" 
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={6}>
                    <Icon as={FiMessageCircle} boxSize={10} color="gray.300" mb={3} />
                    <Text color="gray.500">No Instagram messages to display</Text>
                  </Box>
                )}
              </Box>
            </Card>
            
            {/* Facebook Column */}
            <Card>
              <Box p={4} borderBottom="1px solid" borderColor="gray.100">
                <HStack>
                  <Icon as={FiFacebook} boxSize={6} color="blue.500" />
                  <Heading size="md">Facebook</Heading>
                </HStack>
              </Box>
              
              <Box p={4} maxH="500px" overflowY="auto">
                {facebookMessages.length > 0 ? (
                  facebookMessages.map(message => (
                    <MessageCard 
                      key={message.id} 
                      message={message} 
                      platform="Facebook" 
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={6}>
                    <Icon as={FiMessageCircle} boxSize={10} color="gray.300" mb={3} />
                    <Text color="gray.500">No Facebook messages to display</Text>
                  </Box>
                )}
              </Box>
            </Card>
          </SimpleGrid>
          
          {/* Leads Created from Social Media */}
          <Card>
            <Box p={4} borderBottom="1px solid" borderColor="gray.100">
              <Heading size="md">Leads Created from Social Media</Heading>
            </Box>
            
            <Box p={4} overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Source</Th>
                    <Th>Created</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {socialLeads.length > 0 ? (
                    socialLeads.map(lead => (
                      <Tr key={lead.id}>
                        <Td>
                          <HStack>
                            <Icon 
                              as={lead.lead_source?.toLowerCase() === 'instagram' ? FiInstagram : FiFacebook}
                              color={lead.lead_source?.toLowerCase() === 'instagram' ? 'pink.500' : 'blue.500'}
                            />
                            <Text>{lead.first_name} {lead.last_name}</Text>
                          </HStack>
                        </Td>
                        <Td>{lead.email}</Td>
                        <Td>
                          <Badge
                            colorScheme={lead.lead_source?.toLowerCase() === 'instagram' ? 'pink' : 'blue'}
                          >
                            {lead.lead_source?.charAt(0).toUpperCase() + lead.lead_source?.slice(1)}
                          </Badge>
                        </Td>
                        <Td>{formatTimestamp(lead.created_at)}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Button size="sm" onClick={() => viewLead(lead.id)}>View Lead</Button>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={4}>
                        <Text color="gray.500">No social media leads found</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Card>
          
          {/* Connect Accounts Section */}
          <Card mt={8}>
            <Box p={6}>
              <HStack mb={4} spacing={3}>
                <Icon as={FiLock} boxSize={5} color="orange.500" />
                <Heading size="md">Account Connection Required</Heading>
              </HStack>
              
              <Text mb={4}>
                To enable social media monitoring, please contact your administrator to connect your organization's social media accounts. This feature requires proper authentication and permissions setup.
              </Text>
              
              <Button leftIcon={<FiKey />} colorScheme="blue">
                Contact Admin
              </Button>
            </Box>
          </Card>
        </>
      )}
    </PageContainer>
  )
}

export default SearchSocial 