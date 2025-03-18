import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useToast,
  HStack,
  Select,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
  Spinner,
  List,
  ListItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { FiEdit2, FiPhone, FiCalendar } from 'react-icons/fi'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import { useLocation } from 'react-router-dom'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const API_URL = import.meta.env.VITE_API_URL;

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' }
]

const VOICES = [
  { value: 'florian', label: 'Florian' },
  { value: 'nat', label: 'Nat' },
  { value: 'josh', label: 'Josh' },
  { value: 'june', label: 'June' },
  { value: 'paige', label: 'Paige' },
  { value: 'kiana', label: 'Kiana' },
  { value: 'allie', label: 'Allie' }
]

function MakeCall() {
  const [isLoading, setIsLoading] = useState(false)
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [script, setScript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [scheduleDate, setScheduleDate] = useState(null)
  const [callSettings, setCallSettings] = useState({
    language: 'en',
    voice: 'florian',
    duration: 240, // 4 minutes in seconds
  })
  const toast = useToast()
  const location = useLocation()

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (location.state?.selectedLead) {
      setSelectedLead(location.state.selectedLead)
      generateScript(location.state.selectedLead)
    }
  }, [location])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
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

  const generateScript = async (lead) => {
    setIsGenerating(true)
    try {
      // Add this loading text
      setScript('Generating personalized call script...\n\n✨ AI is crafting your script')

      // First fetch recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('activity_datetime', { ascending: false })
        .limit(3)

      // Format recent activities
      const recentActivities = activities?.length 
        ? activities.map(act => 
            `${new Date(act.activity_datetime).toLocaleDateString()}: ${act.activity_type}`
          ).join('\n')
        : 'No previous activities'

      const payload = {
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping to generate phone call Prompt.

Generate a short, professional call script for a lead with these details:
Name: ${lead.first_name} ${lead.last_name}
Company: ${lead.company_name || 'Not specified'}
Status: ${lead.status}

Recent Activities:
${recentActivities}

Keep the Prompt only 2-3 lines and base it on their recent activity history.

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"script": "Hi [name], this is Chris from SmartLead CRM..."}

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

      const scriptData = JSON.parse(responseText)
      setScript(scriptData.script)

    } catch (error) {
      console.error('Script generation error:', error)
      toast({
        title: 'Error generating script',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const initiateCall = async () => {
    if (!selectedLead?.id || !script) {
      toast({
        title: 'Error',
        description: 'Please select a lead and generate a script',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsCalling(true)
    try {
      const callPayload = {
        language: callSettings.language,
        max_duration: callSettings.duration,
        prompt: script,
        voice: callSettings.voice
      }

      if (scheduleDate) {
        callPayload.scheduled_time = scheduleDate.toISOString()
      }

      console.log('Making call with payload:', callPayload)

      const response = await axios.post(
        `${API_URL}/leads/${selectedLead.id}/call`,
        callPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Call response:', response.data)

      if (response.data) {
        toast({
          title: scheduleDate ? 'Call Scheduled' : 'Call Initiated',
          description: scheduleDate ? 
            'Call has been scheduled successfully' : 
            'Call has been initiated successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })

        // Record the call activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert([{
            lead_id: selectedLead.id,
            activity_type: 'Call Made',
            body: scheduleDate 
              ? `Scheduled call with ${selectedLead.first_name} ${selectedLead.last_name || ''} for ${scheduleDate.toLocaleString()}`
              : `Call initiated with ${selectedLead.first_name} ${selectedLead.last_name || ''} using voice: ${callSettings.voice}`
          }]);

        if (activityError) {
          console.error('Error creating call activity:', activityError);
          throw activityError;
        }

        // Update lead status if needed
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: 'contacted'
          })
          .eq('id', selectedLead.id);

        if (updateError) {
          console.error('Error updating lead status:', updateError);
          throw updateError;
        }

        // Reset form after successful call
        setSelectedLead(null)
        setScript('')
        setScheduleDate(null)
      } else {
        throw new Error('Failed to initiate call')
      }
    } catch (error) {
      console.error('Call error:', error)
      toast({
        title: 'Error making call',
        description: error.response?.data?.detail || error.message || 'Failed to initiate call',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCalling(false)
    }
  }

  const handleLeadSelect = async (lead) => {
    setSelectedLead(lead)
    await generateScript(lead)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Make Calls"
        description="Select a lead and make automated calls"
      />

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
                          {lead.company_name}
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
                  Configure Call for {selectedLead.first_name}
                </Text>

                {/* Call Settings */}
                <FormControl>
                  <FormLabel>Language</FormLabel>
                  <Select
                    value={callSettings.language}
                    onChange={(e) => setCallSettings(prev => ({ ...prev, language: e.target.value }))}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Voice</FormLabel>
                  <Select
                    value={callSettings.voice}
                    onChange={(e) => setCallSettings(prev => ({ ...prev, voice: e.target.value }))}
                  >
                    {VOICES.map(voice => (
                      <option key={voice.value} value={voice.value}>
                        {voice.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <NumberInput
                    max={240}
                    min={30}
                    value={callSettings.duration}
                    onChange={(value) => setCallSettings(prev => ({ ...prev, duration: parseInt(value) }))}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Call Script</FormLabel>
                  <Textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Call script will be generated automatically..."
                    rows={8}
                    isDisabled={isGenerating}
                  />
                </FormControl>

                <HStack>
                  <Button
                    leftIcon={<FiPhone />}
                    colorScheme="green"
                    isLoading={isCalling}
                    onClick={() => initiateCall()}
                  >
                    Make Call Now
                  </Button>

                  <Popover>
                    <PopoverTrigger>
                      <Button leftIcon={<FiCalendar />}>
                        Schedule Call
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
                            onClick={() => initiateCall(scheduleDate.toISOString())}
                            isDisabled={!scheduleDate}
                          >
                            Schedule Call
                          </Button>
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>

                  <Button
                    leftIcon={<FiEdit2 />}
                    variant="ghost"
                    onClick={() => generateScript(selectedLead)}
                    isLoading={isGenerating}
                  >
                    Regenerate Script
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Text color="gray.500">Select a lead to configure and make a call</Text>
            )}
          </Card>
        </Box>
      </HStack>
    </PageContainer>
  )
}

export default MakeCall
