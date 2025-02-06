import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  List,
  ListItem,
  Spinner,
  Icon,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Select,
  Link,
} from '@chakra-ui/react'
import { FiCalendar, FiClock, FiUser, FiVideo, FiPlus, FiInfo } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { CALENDLY_LINK } from '../config/constants'

function Meetings() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [meetingDetails, setMeetingDetails] = useState({
    startTime: '',
    endTime: '',
    eventType: 'Manual Meeting'
  })
  const toast = useToast()

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const { data: activities, error } = await supabase
        .from('activities')
        .select(`
          *,
          lead:lead_id (
            id,
            first_name,
            last_name,
            company_name,
            status
          )
        `)
        .eq('activity_type', 'meeting_scheduled')
        .order('activity_datetime', { ascending: true })

      if (error) throw error

      if (!activities || activities.length === 0) {
        setMeetings([])
        return
      }

      // Parse meeting details from body field instead of description
      const parsedMeetings = activities.map(activity => {
        if (!activity.body) {
          return null
        }

        try {
          const startTimeMatch = activity.body.match(/Start time: ([\d-T:.Z]+)/)
          const endTimeMatch = activity.body.match(/End time: ([\d-T:.Z]+)/)
          const eventTypeMatch = activity.body.match(/Event type: (.+)/)
          
          return {
            ...activity,
            startTime: startTimeMatch ? new Date(startTimeMatch[1]) : null,
            endTime: endTimeMatch ? new Date(endTimeMatch[1]) : null,
            eventType: eventTypeMatch ? eventTypeMatch[1].trim() : 'Not specified',
            lead: activity.lead || {
              first_name: 'Unknown',
              last_name: 'Lead',
              status: 'unknown'
            }
          }
        } catch (parseError) {
          console.error('Error parsing meeting details:', parseError)
          return null
        }
      }).filter(meeting => meeting && meeting.startTime && meeting.endTime)

      const sortedMeetings = parsedMeetings.sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      )

      setMeetings(sortedMeetings)
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = (start, end) => {
    const diff = Math.abs(new Date(end) - new Date(start))
    const minutes = Math.floor(diff / 1000 / 60)
    return `${minutes} minutes`
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      contacted: 'yellow',
      qualified: 'green',
      lost: 'red',
      won: 'purple'
    }
    return colors[status?.toLowerCase()] || 'gray'
  }

  // Add function to create meeting activity
  const createMeetingActivity = async () => {
    try {
      const body = `Start time: ${meetingDetails.startTime}:00.000000Z\nEnd time: ${meetingDetails.endTime}:00.000000Z\nEvent type: ${meetingDetails.eventType}`

      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            lead_id: selectedLead.id,
            activity_type: 'meeting_scheduled',
            body: body,
            activity_datetime: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error

      // Update lead status to qualified
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'qualified' })
        .eq('id', selectedLead.id)

      if (updateError) throw updateError

      toast({
        title: 'Meeting scheduled',
        description: 'The meeting has been added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      setIsModalOpen(false)
      fetchMeetings() // Refresh meetings list
    } catch (error) {
      console.error('Error creating meeting:', error)
      toast({
        title: 'Error',
        description: 'Failed to schedule meeting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Add function to fetch leads for dropdown
  const [leads, setLeads] = useState([])
  
  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, company_name')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLeads(data)
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  return (
    <PageContainer>
      <PageHeader
        title="Upcoming Meetings"
        description="View and manage your scheduled meetings"
      >
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => setIsModalOpen(true)}
        >
          Add Manual Meeting
        </Button>
      </PageHeader>

      <VStack spacing={6} align="stretch">
        {/* Info Card */}
        <Card>
          <HStack p={4} spacing={3}>
            <Icon as={FiInfo} boxSize={5} color="blue.500" />
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">
                Automatic Meeting Sync
              </Text>
              <Text fontSize="sm" color="gray.600">
                All meetings scheduled through <Link href={CALENDLY_LINK} color="blue.500" isExternal>Calendly</Link> automatically appear here. When a Calendly meeting is scheduled, the lead status is automatically updated to "Qualified".
              </Text>
            </VStack>
          </HStack>
        </Card>

        {/* Meetings List Card */}
        <Card>
          <VStack align="stretch" spacing={6} p={6}>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                Scheduled Meetings
              </Text>
              <Badge colorScheme="blue" fontSize="sm" px={2} py={1} borderRadius="full">
                {meetings.length} TOTAL
              </Badge>
            </HStack>

            {loading ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="blue.500" />
              </Box>
            ) : meetings.length === 0 ? (
              <Box py={8} textAlign="center" borderRadius="lg" bg="gray.50">
                <Icon as={FiCalendar} boxSize={8} color="gray.400" mb={3} />
                <Text color="gray.600">No upcoming meetings scheduled</Text>
              </Box>
            ) : (
              <List spacing={4}>
                {meetings.map((meeting) => (
                  <ListItem
                    key={meeting.id}
                    p={4}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                    _hover={{ borderColor: 'blue.200', transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                  >
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg="blue.50"
                          >
                            <FiVideo size={16} color="var(--chakra-colors-blue-500)" />
                          </Box>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              Meeting with {meeting.lead.first_name} {meeting.lead.last_name}
                            </Text>
                            {meeting.lead.company_name && (
                              <Text fontSize="sm" color="gray.600">
                                {meeting.lead.company_name}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        <Badge colorScheme={getStatusColor(meeting.lead.status)}>
                          {meeting.lead.status}
                        </Badge>
                      </HStack>

                      <HStack spacing={6} ml="44px">
                        <HStack spacing={2}>
                          <Icon as={FiCalendar} color="gray.500" />
                          <Text fontSize="sm" color="gray.600">
                            {formatDate(meeting.startTime)}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Icon as={FiClock} color="gray.500" />
                          <Text fontSize="sm" color="gray.600">
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                            {' '}({getDuration(meeting.startTime, meeting.endTime)})
                          </Text>
                        </HStack>
                      </HStack>

                      <HStack spacing={2} ml="44px">
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => navigate(`/lead/${meeting.lead.id}`)}
                        >
                          View Lead
                        </Button>
                        {/* Add more actions like Join Meeting, Reschedule, etc. */}
                      </HStack>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </VStack>

      {/* Add Meeting Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Manual Meeting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Select Lead</FormLabel>
                <Select
                  placeholder="Select a lead"
                  onChange={(e) => {
                    const lead = leads.find(l => l.id === e.target.value)
                    setSelectedLead(lead)
                  }}
                >
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name} {lead.company_name ? `(${lead.company_name})` : ''}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Start Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={meetingDetails.startTime}
                  onChange={(e) => setMeetingDetails(prev => ({
                    ...prev,
                    startTime: e.target.value
                  }))}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>End Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={meetingDetails.endTime}
                  onChange={(e) => setMeetingDetails(prev => ({
                    ...prev,
                    endTime: e.target.value
                  }))}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Event Type</FormLabel>
                <Input
                  value={meetingDetails.eventType}
                  onChange={(e) => setMeetingDetails(prev => ({
                    ...prev,
                    eventType: e.target.value
                  }))}
                  placeholder="e.g., Discovery Call, Follow-up Meeting"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={createMeetingActivity}
              isDisabled={!selectedLead || !meetingDetails.startTime || !meetingDetails.endTime}
            >
              Schedule Meeting
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  )
}

export default Meetings 