import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Badge,
  List,
  ListItem,
  Icon,
  useToast,
  Spinner,
  Center,
  Box,
} from '@chakra-ui/react'
import { FiMail, FiUser, FiArrowRight, FiUsers, FiRefreshCw, FiBriefcase, FiClock } from 'react-icons/fi'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import axios from 'axios'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function CheckEmails() {
  const [emails, setEmails] = useState([])
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoProcess, setAutoProcess] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
    const savedAutoProcess = localStorage.getItem('autoProcessEmails')
    if (savedAutoProcess) {
      setAutoProcess(JSON.parse(savedAutoProcess))
    }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data: emailActivities, error: emailError } = await supabase
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
            email,
            company_name,
            status,
            created_at
          )
        `)
        .eq('activity_type', 'email_received')
        .order('activity_datetime', { ascending: false })

      if (emailError) throw emailError

      const leadIds = [...new Set(emailActivities
        ?.filter(email => email.lead_id)
        .map(email => email.lead_id)
      )]

      let leadData = []
      if (leadIds.length > 0) {
        const { data: leads, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .in('id', leadIds)
          .order('created_at', { ascending: false })

        if (leadError) throw leadError
        leadData = leads || []
      }

      setEmails(emailActivities || [])
      setLeads(leadData)
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

  const processEmails = async () => {
    setIsProcessing(true)
    try {
      // Call the API to process emails - using the correct endpoint from the docs
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/leads/process-emails`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Get newly created leads from email
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_source', 'email')
        .order('created_at', { ascending: false })
        .limit(10)

      if (leadsError) throw leadsError

      // Create activities for these leads
      for (const lead of leads) {
        const { error: activityError } = await supabase
          .from('activities')
          .insert([
            {
              activity_type: 'email_received',
              activity_datetime: lead.created_at,
              body: `Email received from ${lead.email}`,
              lead_id: lead.id,
              metadata: {
                from: lead.email,
                lead_source: 'email',
                lead_status: lead.status
              }
            }
          ])

        if (activityError) {
          console.error('Error creating activity for lead:', lead.id, activityError)
        }
      }

      // Refresh the data and show success message
      await fetchData()
      
      toast({
        title: 'Success',
        description: 'Emails processed and activities created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

    } catch (error) {
      console.error('Email processing error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to process emails',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAutoProcessToggle = (e) => {
    const newValue = e.target.checked
    setAutoProcess(newValue)
    localStorage.setItem('autoProcessEmails', JSON.stringify(newValue))
    
    toast({
      title: newValue ? 'Auto-process enabled' : 'Auto-process disabled',
      description: newValue 
        ? 'Emails will be processed automatically every day' 
        : 'Automatic email processing has been turned off',
      status: 'info',
      duration: 5000,
      isClosable: true,
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
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

  const handleLeadClick = (lead) => {
    navigate(`/lead/${lead.id}`)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <Center h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading emails...</Text>
          </VStack>
        </Center>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Process New Emails"
        description="Check and process new email leads"
      />

      <VStack spacing={8} align="stretch">
        <Card>
          <VStack spacing={6} align="stretch">
            <Text>
              This will check your connected email accounts for new leads and automatically process them into your database.
            </Text>

            <HStack justify="space-between">
              <Button
                leftIcon={<FiRefreshCw />}
                colorScheme="blue"
                onClick={processEmails}
                isLoading={isProcessing}
              >
                Process Emails
              </Button>

              <FormControl display="flex" alignItems="center" maxW="300px">
                <FormLabel htmlFor="auto-process" mb="0">
                  Auto-process daily
                </FormLabel>
                <Switch
                  id="auto-process"
                  isChecked={autoProcess}
                  onChange={handleAutoProcessToggle}
                />
              </FormControl>
            </HStack>
          </VStack>
        </Card>

        {/* Email Activities */}
        <Card>
          <VStack align="stretch" spacing={4}>
            <Text fontWeight="bold" fontSize="lg">Received Emails</Text>
            
            {emails.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>No emails found</Text>
            ) : (
              <List spacing={3}>
                {emails.map((email) => (
                  <ListItem 
                    key={email.id}
                    p={4}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiMail} color="blue.500" />
                          <Text fontWeight="medium">Email Received</Text>
                        </HStack>
                        <Text color="gray.500" fontSize="sm">
                          {formatDate(email.activity_datetime)}
                        </Text>
                      </HStack>
                      <Text>{email.body}</Text>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>

        {/* Generated Leads */}
        <Card>
          <VStack align="stretch" spacing={4}>
            <Text fontWeight="bold" fontSize="lg">Generated Leads</Text>
            
            {isLoading ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="blue.500" />
              </Box>
            ) : leads.length === 0 ? (
              <Box 
                py={8} 
                textAlign="center" 
                borderRadius="lg" 
                bg="gray.50"
              >
                <Icon as={FiMail} boxSize={8} color="gray.400" mb={3} />
                <Text color="gray.600">No email leads to process</Text>
              </Box>
            ) : (
              <List spacing={3}>
                {leads.map((lead) => (
                  <ListItem
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    cursor="pointer"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ 
                      bg: 'gray.50',
                      borderColor: 'blue.200',
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm'
                    }}
                    transition="all 0.2s"
                    role="group"
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg="blue.50"
                          >
                            <FiUser size={14} color="var(--chakra-colors-blue-500)" />
                          </Box>
                          <Text 
                            fontWeight="medium"
                            _groupHover={{ color: 'blue.500' }}
                          >
                            {lead.first_name} {lead.last_name}
                          </Text>
                        </HStack>
                        <Badge colorScheme={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </HStack>

                      {lead.company_name && (
                        <HStack fontSize="sm" color="gray.600" spacing={2} ml="44px">
                          <FiBriefcase size={12} />
                          <Text>{lead.company_name}</Text>
                        </HStack>
                      )}

                      <HStack fontSize="xs" color="gray.500" spacing={2} ml="44px">
                        <FiClock size={12} />
                        <Text>
                          Added {new Date(lead.created_at).toLocaleDateString()}
                        </Text>
                        {lead.email && (
                          <>
                            <Text>•</Text>
                            <FiMail size={12} />
                            <Text>{lead.email}</Text>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </VStack>
    </PageContainer>
  )
}

export default CheckEmails 