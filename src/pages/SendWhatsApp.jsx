import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
  Spinner,
  List,
  ListItem,
  useToast,
  Center,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Input,
} from '@chakra-ui/react'
import { FiEdit2, FiSend, FiCalendar } from 'react-icons/fi'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { typography } from '../theme/constants'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

const API_URL = import.meta.env.VITE_API_URL
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function SendWhatsApp() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [scheduleDate, setScheduleDate] = useState(null)
  const toast = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .not('phone_number', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data)
    } catch (error) {
      toast({
        title: 'Error fetching leads',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeadSelect = async (lead) => {
    setSelectedLead(lead)
    await generateMessageDraft(lead)
  }

  const generateMessageDraft = async (lead) => {
    setIsGenerating(true)
    try {
      // First fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('activity_datetime', { ascending: false })
        .limit(5)

      if (activitiesError) throw activitiesError

      // Format recent activities
      const recentActivities = activities?.length 
        ? activities.map(act => 
            `${new Date(act.activity_datetime).toLocaleDateString()}: ${act.activity_type} - ${act.body || 'No details'}`
          ).join('\n')
        : 'No previous activities'

      const payload = {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping to generate WhatsApp messages for leads.

Generate a short, professional WhatsApp message for a lead with these details:
Name: ${lead.first_name} ${lead.last_name}
Company: ${lead.company_name || 'Not specified'}
Status: ${lead.status}
Phone: ${lead.phone_number}

Recent Activities:
${recentActivities}

Keep the message friendly but professional, and reference their recent activity if relevant.
Keep the message under 200 characters.
Do not include emojis.

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"message": "Hi [name], this is Chris from SmartLead CRM..."}

Do not include any other text, markdown, or formatting - ONLY the JSON object.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 0.9
      }

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      let responseText = response.data.choices[0]?.message?.content || ''
      responseText = responseText
        .replace(/^[\s\S]*?{/, '{')
        .replace(/}[\s\S]*$/, '}')
        .trim()

      const messageData = JSON.parse(responseText)
      setMessage(messageData.message)

    } catch (error) {
      console.error('Message generation error:', error)
      toast({
        title: 'Error generating message',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const sendWhatsApp = async (scheduleTime = null) => {
    if (!selectedLead?.id || !message) {
      toast({
        title: 'Error',
        description: 'Please select a lead and enter a message',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsSending(true)
    try {
      const encodedMessage = encodeURIComponent(message)
      const url = `${API_URL}/leads/${selectedLead.id}/send-whatsapp`
      
      const payload = {
        message: message,
        scheduled_time: scheduleTime
      }

      const response = await axios({
        method: 'post',
        url: url,
        data: payload,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('WhatsApp response:', response.data)

      toast({
        title: scheduleTime ? 'Message Scheduled' : 'Message Sent',
        description: scheduleTime ? 
          'WhatsApp message has been scheduled' : 
          'WhatsApp message has been sent',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Create activity record
      await supabase.from('activities').insert([{
        activity_type: 'whatsapp_message',
        activity_datetime: new Date().toISOString(),
        lead_id: selectedLead.id,
        body: `WhatsApp message ${scheduleTime ? 'scheduled' : 'sent'}: ${message}`,
        metadata: {
          message,
          scheduled_time: scheduleTime
        }
      }])

      setSelectedLead(null)
      setMessage('')
      setScheduleDate(null)

    } catch (error) {
      console.error('Send error details:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        url: `${API_URL}/leads/${selectedLead.id}/send-whatsapp?message=${encodeURIComponent(message)}`
      })
      
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send WhatsApp message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSending(false)
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

  if (isLoading) {
    return (
      <PageContainer>
        <Center h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading WhatsApp data...</Text>
          </VStack>
        </Center>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Send WhatsApp"
        description="Select a lead and compose personalized WhatsApp messages"
      />

      <Box p={6}>
        <HStack align="start" spacing={8}>
          {/* Left Panel */}
          <Box w="350px">
            <VStack spacing={4} align="stretch">
              <Card p={4}>
                <Text fontWeight="semibold" mb={3}>Filter Leads</Text>
                <HStack spacing={2} wrap="wrap">
                  {['all', 'new', 'contacted', 'qualified', 'lost', 'won'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedStatus === status ? 'solid' : 'outline'}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </HStack>
              </Card>

              <Card p={4}>
                <Text fontWeight="semibold" mb={3}>Select Lead</Text>
                {isLoading ? (
                  <Spinner />
                ) : (
                  <List spacing={2}>
                    {leads
                      .filter(lead => selectedStatus === 'all' || lead.status === selectedStatus)
                      .map((lead) => (
                        <ListItem
                          key={lead.id}
                          onClick={() => handleLeadSelect(lead)}
                          cursor="pointer"
                          p={3}
                          borderRadius="md"
                          bg={selectedLead?.id === lead.id ? 'blue.50' : 'transparent'}
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Text fontWeight="medium">
                            {lead.first_name} {lead.last_name}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {lead.phone_number}
                          </Text>
                        </ListItem>
                      ))}
                  </List>
                )}
              </Card>
            </VStack>
          </Box>

          {/* Right Panel */}
          <Box flex={1}>
            <Card p={6}>
              {selectedLead ? (
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="semibold">
                    Compose Message for {selectedLead.first_name}
                  </Text>
                  <FormControl>
                    <FormLabel>Message</FormLabel>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message..."
                      rows={6}
                      isDisabled={isGenerating}
                    />
                  </FormControl>

                  <HStack spacing={4}>
                    <Button
                      leftIcon={<FiSend />}
                      colorScheme="blue"
                      onClick={() => sendWhatsApp()}
                      isLoading={isSending}
                    >
                      Send Now
                    </Button>

                    <Popover>
                      <PopoverTrigger>
                        <Button leftIcon={<FiCalendar />}>
                          Schedule
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent p={4}>
                        <PopoverBody>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel>Select Date and Time</FormLabel>
                              <DatePicker
                                selected={scheduleDate}
                                onChange={setScheduleDate}
                                showTimeSelect
                                dateFormat="MMMM d, yyyy h:mm aa"
                                minDate={new Date()}
                                customInput={
                                  <Input />
                                }
                              />
                            </FormControl>
                            <Button
                              colorScheme="blue"
                              w="full"
                              onClick={() => sendWhatsApp(scheduleDate.toISOString())}
                              isDisabled={!scheduleDate}
                            >
                              Schedule Message
                            </Button>
                          </VStack>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>

                    <Button
                      leftIcon={<FiEdit2 />}
                      variant="ghost"
                      onClick={() => generateMessageDraft(selectedLead)}
                      isLoading={isGenerating}
                    >
                      Regenerate
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Text color="gray.500">Select a lead to compose a message</Text>
              )}
            </Card>
          </Box>
        </HStack>
      </Box>
    </PageContainer>
  )
}

export default SendWhatsApp 