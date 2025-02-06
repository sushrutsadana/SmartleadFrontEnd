import { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Textarea,
  useToast,
  Checkbox,
  List,
  ListItem,
  Badge,
  Spinner,
  FormControl,
  FormLabel,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { FiCalendar, FiClock, FiEdit2, FiSend } from 'react-icons/fi'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { brandColors, spacing, typography } from '../theme/constants'
import PageContainer from '../components/PageContainer'
import { useLocation } from 'react-router-dom'
import { CALENDLY_LINK, CTA_MESSAGES } from '../config/constants'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const API_URL = import.meta.env.VITE_API_URL
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

function SendEmails() {
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [emailBody, setEmailBody] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [scheduleDate, setScheduleDate] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const toast = useToast()
  const location = useLocation()

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    // If a lead was passed through navigation
    if (location.state?.selectedLead) {
      setSelectedLead(location.state.selectedLead)
      generateEmailDraft(location.state.selectedLead)
    }
  }, [location])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
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

  const generateEmailDraft = async (lead) => {
    setIsGenerating(true)
    try {
      // Add loading text
      setEmailBody('Generating personalized email...\n\n✨ AI is crafting your message')
      setEmailSubject('Generating subject...')

      console.log('Starting email generation for lead:', lead)

      // Fetch lead activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('activity_datetime', { ascending: false })

      console.log('Fetched activities:', activities)

      const formattedActivities = activities.map(activity => ({
        type: activity.activity_type,
        date: new Date(activity.activity_datetime).toLocaleDateString(),
        details: activity.body
      }))

      console.log('Formatted activities:', formattedActivities)

      const payload = {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content: `You are Chris Evans, SDR at SmartLead CRM (smartleadplatform@gmail.com).
              
              Current Lead Context:
              - Name: ${lead.first_name} ${lead.last_name}
              - Email: ${lead.email}
              - Company: ${lead.company_name || 'Not specified'}
              - Status: ${lead.status}
              
              Lead Activity History:
              ${formattedActivities.map(a => `- ${a.date}: ${a.type} - ${a.details}`).join('\n')}
              
              Your goal is to craft a personalized follow-up email that:
              1. References their past interactions and activity history
              2. Highlights how SmartLead CRM's AI-driven capabilities can solve their specific needs
              3. Maintains a professional yet friendly tone
              4. Always includes this exact meeting scheduling text: "I'd love to schedule a quick call to discuss how we can tailor SmartLead CRM to your specific needs. Would you be available for a 30-minute meeting? You can schedule directly here: https://calendly.com/smartleadplatform"
              5. Demonstrates understanding of their business context

              CRITICAL: Respond with ONLY a JSON object in this exact format:
              {
                "subject": "Your subject line here",
                "body": "Your email body here\\n\\nSecond paragraph here\\n\\nI'd love to schedule...",
                "signature": "Best regards,\\nChris Evans\\nSales Development Representative\\nSmartLead CRM\\nsmartleadplatform@gmail.com"
              }

              Note: The signature must be exactly as shown above, with the exact line breaks (\\n) and text.`
          },
          {
            role: "user",
            content: `Generate the email JSON object. Include the exact signature format as specified.`
          }
        ],
        temperature: 0.6,
        max_tokens: 4096,
        top_p: 0.95
      }

      console.log('Request payload:', payload)
      console.log('Using Groq API Key:', GROQ_API_KEY ? 'Present' : 'Missing')

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      let responseText = response.data.choices[0]?.message?.content || ''
      
      // Clean up the response text
      try {
        // Remove any markdown or extra text
        responseText = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim()

        // Ensure it starts with { and ends with }
        responseText = responseText
          .replace(/^[\s\S]*?{/, '{')
          .replace(/}[\s\S]*$/, '}')
          .trim()

        const emailData = JSON.parse(responseText)

        // Validate required fields
        if (!emailData.subject || !emailData.body || !emailData.signature) {
          throw new Error('Missing required email fields')
        }

        // Add default signature if missing or invalid
        const defaultSignature = "Best regards,\nChris Evans\nSales Development Representative\nSmartLead CRM\nsmartleadplatform@gmail.com"
        
        if (!emailData.signature.includes('SmartLead CRM')) {
          emailData.signature = defaultSignature
        }

        setEmailSubject(emailData.subject)
        setEmailBody(`${emailData.body}\n\n${emailData.signature}`)

      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        
        // Fallback content
        setEmailSubject(`Following up - ${lead.first_name}`)
        setEmailBody(`Hi ${lead.first_name},\n\nI hope this email finds you well. I wanted to follow up regarding SmartLead CRM and how we can help optimize your lead generation process.\n\nWould you be available for a quick call this week?\n\nBest regards,\nChris Evans\nSales Development Representative\nSmartLead CRM\nsmartleadplatform@gmail.com`)
        
        toast({
          title: 'Using fallback email template',
          description: 'The AI-generated email had formatting issues. Using a standard template instead.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }

    } catch (error) {
      console.error('Email generation error:', error)
      toast({
        title: 'Error generating email',
        description: 'Failed to generate email. Please try again or use manual input.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })

      // Set fallback content
      setEmailSubject(`Following up - ${lead.first_name}`)
      setEmailBody(`Hi ${lead.first_name},\n\nI hope this email finds you well. I wanted to follow up regarding SmartLead CRM and how we can help optimize your lead generation process.\n\nWould you be available for a quick call this week?\n\nBest regards,\nChris Evans\nSales Development Representative\nSmartLead CRM\nsmartleadplatform@gmail.com`)

    } finally {
      setIsGenerating(false)
    }
  }

  const handleLeadSelect = async (lead) => {
    setSelectedLead(lead)
    await generateEmailDraft(lead)
  }

  const sendEmail = async (scheduleTime = null) => {
    setIsSending(true)
    try {
      if (!selectedLead?.id) {
        throw new Error('No lead selected')
      }

      // Ensure we have a clean base URL without trailing slash
      const baseUrl = 'https://smartlead-python-six.vercel.app'
      
      // Note the hyphen in 'send-email' instead of underscore
      const url = `${baseUrl}/leads/${selectedLead.id}/send-email`
      
      console.log('Selected Lead ID:', selectedLead.id)
      console.log('Request URL:', url)

      const requestBody = {
        subject: emailSubject,
        body: emailBody,
        cc: null,
        bcc: null
      }

      console.log('Request body:', requestBody)

      const response = await axios({
        method: 'POST',
        url: url,
        data: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('Send email response:', response)

      if (response.data) {
        toast({
          title: 'Email Sent',
          description: 'Email has been sent successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })

        // Reset form
        setSelectedLead(null)
        setEmailBody('')
        setEmailSubject('')
        setScheduleDate(null)
      }
    } catch (error) {
      console.error('Send email error:', {
        error: error.message,
        response: error.response?.data,
        leadId: selectedLead?.id,
        requestBody: {
          subject: emailSubject,
          body: emailBody,
          cc: null,
          bcc: null
        }
      })

      toast({
        title: 'Error sending email',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSending(false)
    }
  }

  // Add the status color helper function
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

  const composeEmail = (template, lead) => {
    const emailBody = template.replace(/{{name}}/g, lead.first_name)
    return `${emailBody}${CTA_MESSAGES.email}`
  }

  return (
    <PageContainer>
      <PageHeader
        title="Send Emails"
        description="Select a lead and compose personalized emails"
      />

      <Grid templateColumns="350px 1fr" gap={12}>
        {/* Left Panel */}
        <VStack align="stretch" spacing={6}>
          <Card>
            <Text {...typography.heading.section} mb={4}>
              Filter Leads
            </Text>
            <HStack spacing={3} wrap="wrap">
              {['all', 'new', 'contacted', 'qualified', 'lost', 'won'].map((status) => (
                <Button
                  key={status}
                  size="md"
                  variant={selectedStatus === status ? 'solid' : 'outline'}
                  colorScheme={status === 'all' ? 'gray' : getStatusColor(status)}
                  onClick={() => setSelectedStatus(status)}
                  px={4}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </HStack>
          </Card>

          <Card flex={1} maxH="calc(100vh - 380px)" overflowY="auto">
            <Text {...typography.heading.section} mb={4}>
              Select Lead
            </Text>
            {isLoading ? (
              <VStack py={8}>
                <Spinner color="brand.teal" />
                <Text color="gray.500">Loading leads...</Text>
              </VStack>
            ) : (
              <List spacing={3}>
                {leads
                  .filter(lead => selectedStatus === 'all' || lead.status === selectedStatus)
                  .map((lead) => (
                    <ListItem
                      key={lead.id}
                      p={4}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={selectedLead?.id === lead.id ? 'blue.50' : 'white'}
                      _hover={{ bg: 'gray.50' }}
                      onClick={() => handleLeadSelect(lead)}
                      border="1px solid"
                      borderColor={selectedLead?.id === lead.id ? 'blue.200' : 'gray.100'}
                      transition="all 0.2s"
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="600">
                            {lead.first_name} {lead.last_name}
                          </Text>
                          <Badge colorScheme={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </HStack>
                        <HStack spacing={3} color="gray.600" fontSize="sm">
                          <Text>{lead.email}</Text>
                          {lead.company_name && (
                            <>
                              <Text>•</Text>
                              <Text>{lead.company_name}</Text>
                            </>
                          )}
                        </HStack>
                      </VStack>
                    </ListItem>
                  ))}
              </List>
            )}
          </Card>
        </VStack>

        {/* Right Panel */}
        <Card minH="calc(100vh - 280px)" maxW="1200px" w="full">
          {selectedLead ? (
            <VStack spacing={10} align="stretch">
              <HStack justify="space-between" pb={4}>
                <VStack align="start" spacing={2}>
                  <Text {...typography.heading.secondary}>
                    Compose Email
                  </Text>
                  <Text {...typography.body.small}>
                    Writing to: {selectedLead.first_name} {selectedLead.last_name}
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FiEdit2 />}
                  variant="ghost"
                  size="lg"
                  onClick={() => generateEmailDraft(selectedLead)}
                  isLoading={isGenerating}
                >
                  Regenerate
                </Button>
              </HStack>

              <FormControl>
                <FormLabel fontSize="md">Subject</FormLabel>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                  size="lg"
                  h="56px"
                  fontSize="md"
                  px={4}
                />
              </FormControl>

              <FormControl flex={1}>
                <FormLabel fontSize="md">Body</FormLabel>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email body"
                  size="lg"
                  minH="500px"
                  p={6}
                  fontSize="md"
                  lineHeight="tall"
                  resize="vertical"
                />
              </FormControl>

              <HStack justify="space-between" pt={8}>
                <HStack spacing={4}>
                  <Button
                    leftIcon={<FiSend />}
                    colorScheme="blue"
                    size="lg"
                    onClick={() => sendEmail()}
                    isLoading={isSending}
                    px={8}
                    h="56px"
                    fontSize="md"
                  >
                    Send Now
                  </Button>

                  <Popover placement="top">
                    <PopoverTrigger>
                      <Button
                        leftIcon={<FiCalendar />}
                        size="lg"
                        variant="outline"
                        h="56px"
                        px={8}
                        fontSize="md"
                      >
                        Schedule Send
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent p={6} w="320px">
                      <PopoverBody>
                        <VStack spacing={6}>
                          <FormControl>
                            <FormLabel fontSize="sm">Select Date and Time</FormLabel>
                            <DatePicker
                              selected={scheduleDate}
                              onChange={setScheduleDate}
                              showTimeSelect
                              dateFormat="MMMM d, yyyy h:mm aa"
                              minDate={new Date()}
                              customInput={
                                <Input
                                  size="lg"
                                  h="48px"
                                  cursor="pointer"
                                />
                              }
                            />
                          </FormControl>
                          <Button
                            w="full"
                            colorScheme="blue"
                            size="lg"
                            h="48px"
                            onClick={() => sendEmail(scheduleDate.toISOString())}
                            isDisabled={!scheduleDate}
                          >
                            Schedule
                          </Button>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </HStack>
              </HStack>
            </VStack>
          ) : (
            <VStack py={16} spacing={4}>
              <Text {...typography.body.regular} color={brandColors.text.muted}>
                Select a lead to compose an email
              </Text>
              <Text {...typography.body.small}>
                Choose from the list on the left to get started
              </Text>
            </VStack>
          )}
        </Card>
      </Grid>
    </PageContainer>
  )
}

export default SendEmails 