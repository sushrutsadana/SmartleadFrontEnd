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
} from '@chakra-ui/react'
import { FiEdit2, FiSend } from 'react-icons/fi'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { typography } from '../theme/constants'

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
  const toast = useToast()

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
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
      const payload = {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping to generate WhatsApp messages.

Generate a short, friendly WhatsApp message for a lead with these details:
Name: ${lead.first_name} ${lead.last_name}
Company: ${lead.company_name || 'Not specified'}
Status: ${lead.status}

The message should:
1. Be professional but conversational
2. Highlight SmartLead CRM's value
3. Include a clear call to action
4. Be appropriate for WhatsApp (brief)

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"message": "Hi [name], [your message here]"}

Do not include any other text, markdown, or formatting - ONLY the JSON object.`
          }
        ],
        temperature: 0.5,
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

  const sendWhatsApp = async () => {
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
      const url = `${API_URL}/leads/${selectedLead.id}/send-whatsapp?message=${encodedMessage}`

      const response = await axios({
        method: 'post',
        url: url,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('WhatsApp response:', response.data)

      toast({
        title: 'Message Sent',
        description: 'WhatsApp message has been processed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      setSelectedLead(null)
      setMessage('')

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

  return (
    <Box>
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
                      placeholder="Type your message..."
                      rows={6}
                    />
                  </FormControl>
                  <Button
                    colorScheme="green"
                    leftIcon={<FiSend />}
                    isLoading={isSending}
                    onClick={sendWhatsApp}
                    alignSelf="flex-start"
                  >
                    Send WhatsApp
                  </Button>
                </VStack>
              ) : (
                <Text color="gray.500">Select a lead to compose a message</Text>
              )}
            </Card>
          </Box>
        </HStack>
      </Box>
    </Box>
  )
}

export default SendWhatsApp 