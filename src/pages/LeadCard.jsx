import { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Divider,
  Icon,
  useToast,
  Select,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Stack
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { 
  FiMail, 
  FiPhone, 
  FiBriefcase, 
  FiMessageSquare,
  FiClock,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiStar,
  FiAlertCircle
} from 'react-icons/fi'
import axios from 'axios'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

const API_URL = import.meta.env.VITE_API_URL

function LeadCard() {
  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'lost', label: 'Lost' },
    { value: 'won', label: 'Won' },
  ]

  useEffect(() => {
    fetchLead()
    fetchActivities()
  }, [id])

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setLead(data)
    } catch (error) {
      toast({
        title: 'Error fetching lead',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('lead_id', id)
        .order('activity_datetime', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      toast({
        title: 'Error fetching activities',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoadingActivities(false)
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

  const handleStatusChange = async (newStatus) => {
    setSelectedStatus(newStatus)
    onOpen()
  }

  const updateLeadStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      // Update status in leads table
      const { error: statusError } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id)

      if (statusError) throw statusError

      // Create activity record with correct column names
      const { error: activityError } = await supabase
        .from('activities')
        .insert([
          {
            lead_id: id,
            activity_type: 'status_change',
            body: `Status updated to ${newStatus}`,
            activity_datetime: new Date().toISOString()
          }
        ])

      if (activityError) throw activityError

      setLead(prev => ({
        ...prev,
        status: newStatus
      }))

      // Refresh activities
      fetchActivities()

      toast({
        title: 'Status Updated',
        description: `Lead status updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error Updating Status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsUpdating(false)
      onClose()
    }
  }

  const getLeadActivity = async () => {
    try {
      const response = await axios.get(`${API_URL}/leads/${id}/activity`);
      // Handle activity data
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const getActivityIcon = (activity_type) => {
    switch (activity_type?.toLowerCase()) {
      case 'email_sent':
        return FiMail
      case 'call_made':
        return FiPhone
      case 'whatsapp_sent':
        return FiMessageSquare
      case 'status_change':
        return FiRefreshCw
      case 'qualified':
        return FiStar
      case 'lost':
        return FiX
      case 'won':
        return FiCheck
      default:
        return FiClock
    }
  }

  const getActivityColor = (activity_type) => {
    switch (activity_type?.toLowerCase()) {
      case 'email_sent':
        return 'blue'
      case 'call_made':
        return 'green'
      case 'whatsapp_sent':
        return 'yellow'
      case 'status_change':
        return 'purple'
      case 'qualified':
        return 'teal'
      case 'lost':
        return 'red'
      case 'won':
        return 'green'
      default:
        return 'gray'
    }
  }

  if (loading) {
    return <Box p={6}>Loading...</Box>
  }

  if (!lead) {
    return <Box p={6}>Lead not found</Box>
  }

  return (
    <Box p={{ base: 2, md: 6 }}>
      <Card>
        <CardBody>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Header with Name and Status */}
            <Box>
              <Heading size={{ base: "md", md: "lg" }} mb={2}>
                {lead.first_name} {lead.last_name}
              </Heading>
              <Stack 
                direction={{ base: "column", md: "row" }} 
                align={{ base: "stretch", md: "center" }} 
                spacing={4}
              >
                <Text fontWeight="500" color="gray.700">Status:</Text>
                <Select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  width={{ base: "full", md: "200px" }}
                  size="md"
                  variant="filled"
                  isDisabled={isUpdating}
                  bg={`${getStatusColor(lead.status)}.50`}
                  _hover={{ bg: `${getStatusColor(lead.status)}.100` }}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Badge 
                  colorScheme={getStatusColor(lead.status)}
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              </Stack>
            </Box>

            <Divider />

            {/* Contact Information */}
            <Box>
              <Heading size="sm" mb={4}>Contact Information</Heading>
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Icon as={FiMail} color="gray.500" />
                  <Text>{lead.email}</Text>
                </HStack>
                {lead.phone && (
                  <HStack>
                    <Icon as={FiPhone} color="gray.500" />
                    <Text>{lead.phone}</Text>
                  </HStack>
                )}
                {lead.company_name && (
                  <HStack>
                    <Icon as={FiBriefcase} color="gray.500" />
                    <Text>{lead.company_name}</Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Actions */}
            <Box>
              <Heading size="sm" mb={4}>Actions</Heading>
              <Stack 
                direction={{ base: "column", md: "row" }} 
                spacing={4}
                w="full"
              >
                <Button
                  leftIcon={<FiMail />}
                  colorScheme="blue"
                  variant="outline"
                  size="md"
                >
                  Send Email
                </Button>
                <Button
                  leftIcon={<FiPhone />}
                  colorScheme="green"
                  variant="outline"
                  size="md"
                >
                  Make Call
                </Button>
                <Button
                  leftIcon={<FiMessageSquare />}
                  colorScheme="yellow"
                  variant="outline"
                  size="md"
                >
                  Send WhatsApp
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Lead Activity */}
            <Box>
              <Heading size="sm" mb={4}>Lead Activity</Heading>
              <VStack spacing={3} align="stretch">
                {loadingActivities ? (
                  <Box textAlign="center" py={4}>
                    <Spinner size="md" />
                    <Text mt={2}>Loading activities...</Text>
                  </Box>
                ) : activities.length === 0 ? (
                  <Box 
                    textAlign="center" 
                    py={8} 
                    px={4} 
                    borderRadius="lg" 
                    borderWidth="1px" 
                    borderStyle="dashed"
                  >
                    <Icon as={FiClock} boxSize={6} color="gray.400" mb={2} />
                    <Text color="gray.500">No activities recorded yet</Text>
                  </Box>
                ) : (
                  activities.map((activity) => (
                    <Box
                      key={activity.id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                      _hover={{ 
                        boxShadow: 'sm',
                        borderColor: `${getActivityColor(activity.activity_type)}.200`
                      }}
                      transition="all 0.2s"
                    >
                      <HStack spacing={4} align="flex-start">
                        <Box
                          p={2}
                          borderRadius="full"
                          bg={`${getActivityColor(activity.activity_type)}.50`}
                          color={`${getActivityColor(activity.activity_type)}.500`}
                        >
                          <Icon 
                            as={getActivityIcon(activity.activity_type)} 
                            boxSize={5}
                          />
                        </Box>
                        <Box flex={1}>
                          <HStack justify="space-between" align="flex-start">
                            <Box>
                              <Text 
                                fontWeight="600"
                                color={`${getActivityColor(activity.activity_type)}.700`}
                              >
                                {activity.activity_type.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </Text>
                              {activity.body && (
                                <Text 
                                  fontSize="sm" 
                                  color="gray.600" 
                                  mt={1}
                                >
                                  {activity.body}
                                </Text>
                              )}
                            </Box>
                            <Text 
                              fontSize="sm" 
                              color="gray.500"
                              whiteSpace="nowrap"
                            >
                              {new Date(activity.activity_datetime).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructive={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Update Lead Status
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to update the lead status to {selectedStatus}?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={() => updateLeadStatus(selectedStatus)} 
                ml={3}
                isLoading={isUpdating}
              >
                Update
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default LeadCard 