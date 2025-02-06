import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Spinner,
  Badge,
  List,
  ListItem,
  Grid,
  Icon,
  useToast,
  Box,
  Button,
  useColorModeValue,
  useClipboard,
} from '@chakra-ui/react'
import { FiMessageSquare, FiUser, FiArrowRight, FiUsers, FiCopy, FiCheckCircle } from 'react-icons/fi'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { typography } from '../theme/constants'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function SearchWhatsApp() {
  const [messages, setMessages] = useState([])
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()
  const bgHover = useColorModeValue('gray.50', 'gray.700')
  const { hasCopied: hasPhoneCopied, onCopy: onPhoneCopy } = useClipboard("+1 415 523 8886")
  const { hasCopied: hasCodeCopied, onCopy: onCodeCopy } = useClipboard("join balloon-differ")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch WhatsApp messages from activities table
      const { data: receivedMessages, error: messagesError } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          activity_datetime,
          body,
          lead_id,
          leads (
            id,
            first_name,
            last_name,
            phone_number,
            company_name,
            status
          )
        `)
        .eq('activity_type', 'whatsapp_message')
        .order('activity_datetime', { ascending: false })

      if (messagesError) {
        console.error('Messages error:', messagesError)
        throw messagesError
      }

      // Get unique lead IDs from the messages
      const leadIds = [...new Set(receivedMessages
        .filter(msg => msg.lead_id)
        .map(msg => msg.lead_id)
      )]

      // Fetch only the leads that have WhatsApp messages
      const { data: whatsappLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('id', leadIds)
        .order('created_at', { ascending: false })

      if (leadsError) {
        console.error('Leads error:', leadsError)
        throw leadsError
      }

      console.log('Fetched messages:', receivedMessages)
      console.log('Fetched leads:', whatsappLeads)

      setMessages(receivedMessages || [])
      setLeads(whatsappLeads || [])
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
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      contacted: 'yellow',
      qualified: 'green',
      lost: 'red',
      won: 'purple'
    }
    return colors[status] || 'gray'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const LoadingState = () => (
    <VStack py={8}>
      <Spinner color="brand.teal" />
      <Text color="gray.500">Loading data...</Text>
    </VStack>
  )

  const EmptyState = ({ type, icon }) => (
    <VStack py={8} spacing={3}>
      <Icon as={icon} boxSize={8} color="gray.400" />
      <Text color="gray.500">No {type} found</Text>
    </VStack>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Search WhatsApp"
        description="View received WhatsApp messages and generated leads"
      />

      <Grid templateColumns="repeat(2, 1fr)" gap={6} px={6}>
        {/* Messages Section */}
        <Card>
          <VStack align="stretch" spacing={6}>
            <Text {...typography.heading.section}>
              Received Messages
            </Text>
            
            {isLoading ? (
              <LoadingState />
            ) : messages.length === 0 ? (
              <EmptyState type="messages" icon={FiMessageSquare} />
            ) : (
              <List spacing={3}>
                {messages.map((message) => (
                  <ListItem 
                    key={message.id}
                    p={4}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    _hover={{ borderColor: 'blue.200' }}
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(message.activity_datetime)}
                        </Text>
                        <Badge colorScheme="blue">
                          {message.activity_type}
                        </Badge>
                      </HStack>
                      <Text>{message.body}</Text>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>

        {/* Leads Section */}
        <Card>
          <VStack align="stretch" spacing={6}>
            <Text {...typography.heading.section}>
              Generated Leads
            </Text>
            
            {isLoading ? (
              <LoadingState />
            ) : leads.length === 0 ? (
              <EmptyState type="leads" icon={FiUsers} />
            ) : (
              <List spacing={3}>
                {leads.map((lead) => (
                  <ListItem 
                    key={lead.id}
                    p={4}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => navigate(`/lead/${lead.id}`)}
                    _hover={{ borderColor: 'blue.200' }}
                  >
                    <HStack justify="space-between">
                      <HStack spacing={4}>
                        <Icon as={FiUser} color="blue.500" />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">
                            {lead.first_name} {lead.last_name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {lead.phone_number}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge colorScheme={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </Grid>
    </PageContainer>
  )
}

export default SearchWhatsApp 