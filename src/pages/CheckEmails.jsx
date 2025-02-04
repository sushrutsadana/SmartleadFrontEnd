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
} from '@chakra-ui/react'
import { FiMail, FiUser, FiArrowRight, FiUsers, FiRefreshCw } from 'react-icons/fi'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/process-emails`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to process emails')
      
      const emailData = await response.json()

      // Create activities for the newly created leads
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

      toast({
        title: 'Success',
        description: 'Emails processed and activities created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      await fetchData()
    } catch (error) {
      console.error('Process error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to process emails',
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
            
            {isLoading ? (
              <HStack justify="center" py={4}>
                <Spinner />
                <Text>Loading emails...</Text>
              </HStack>
            ) : emails.length === 0 ? (
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
              <HStack justify="center" py={4}>
                <Spinner />
                <Text>Loading leads...</Text>
              </HStack>
            ) : leads.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={4}>No leads found</Text>
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
                    onClick={() => navigate(`/leads/${lead.id}`)}
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
                            {lead.email}
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
      </VStack>
    </PageContainer>
  )
}

export default CheckEmails 