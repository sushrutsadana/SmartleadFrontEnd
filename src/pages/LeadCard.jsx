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
  Stack,
  Input,
  IconButton,
  Tooltip,
  Grid,
  FormControl,
  FormLabel,
  Center
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
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
  FiAlertCircle,
  FiEdit2
} from 'react-icons/fi'
import axios from 'axios'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import PhoneInput from '../components/PhoneInput'
import CardComponent from '../components/Card'

const API_URL = import.meta.env.VITE_API_URL

function LeadCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    phone_number: '',
  })

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
      setEditedLead(data)
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

  // Add phone number validation helper
  const validatePhoneNumber = (phone) => {
    // Basic validation - can be made more sophisticated
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length >= 10
  }

  // Update handleSave function
  const handleSave = async () => {
    setIsUpdating(true)
    try {
      // Validate required fields
      if (!editedLead.first_name || !editedLead.last_name || !editedLead.email) {
        throw new Error('Name and email are required fields')
      }

      // Format phone number if present
      let formattedPhone = editedLead.phone_number ? editedLead.phone_number.trim() : null
      if (formattedPhone && !validatePhoneNumber(formattedPhone)) {
        throw new Error('Please enter a valid phone number')
      }

      // Prepare update data
      const updateData = {
        first_name: editedLead.first_name.trim(),
        last_name: editedLead.last_name.trim(),
        email: editedLead.email.trim(),
        company_name: editedLead.company_name?.trim() || null,
        phone_number: formattedPhone
      }

      console.log('Updating lead with data:', updateData) // Debug log

      // Update the lead in Supabase
      const { data, error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()

      if (updateError) throw updateError

      console.log('Supabase update response:', data) // Debug log

      // Create activity log
      const { error: activityError } = await supabase
        .from('activities')
        .insert([
          {
            lead_id: id,
            activity_type: 'lead_updated',
            body: `Lead information updated${formattedPhone ? ' (including phone number)' : ''}`,
            activity_datetime: new Date().toISOString()
          }
        ])

      if (activityError) throw activityError

      // Update local state with the response data
      setLead(data[0])
      setEditedLead(data[0])
      setIsEditing(false)
      
      toast({
        title: 'Lead updated successfully',
        status: 'success',
        duration: 3000,
      })

      // Refresh activities
      fetchActivities()

    } catch (error) {
      console.error('Error updating lead:', error) // Debug log
      toast({
        title: 'Error updating lead',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditedLead(lead)
    setIsEditing(false)
  }

  // Add handlers for each action
  const handleSendEmail = () => {
    navigate('/send-emails', { 
      state: { selectedLead: lead }
    })
  }

  const handleMakeCall = () => {
    navigate('/calls', {
      state: { selectedLead: lead }
    })
  }

  const handleSendWhatsApp = () => {
    navigate('/send-whatsapp', {
      state: { selectedLead: lead }
    })
  }

  if (loading) {
    return <Box p={6}>Loading...</Box>
  }

  if (!lead) {
    return <Box p={6}>Lead not found</Box>
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Lead Details"
        description="View and manage lead information"
      />
      
      <CardComponent>
        <Box 
          maxW="1000px"
          w="full"
          py={4}
          pr={{ base: 4, lg: 8 }}
          pl={{ base: 4, lg: 2 }}
          ml={0}
        >
          <Card
            borderRadius="2xl"
            boxShadow="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.100"
            bg="white"
            _hover={{
              boxShadow: 'xl',
            }}
            transition="all 0.2s"
          >
            {/* Header Section with Gradient */}
            <Box
              bgGradient="linear(to-r, brand.teal, brand.blue)"
              p={6}
              color="white"
            >
              {isEditing ? (
                <VStack align="stretch" spacing={4}>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                    <FormControl>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        value={editedLead.first_name}
                        onChange={(e) => setEditedLead(prev => ({
                          ...prev,
                          first_name: e.target.value
                        }))}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        value={editedLead.last_name}
                        onChange={(e) => setEditedLead(prev => ({
                          ...prev,
                          last_name: e.target.value
                        }))}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        value={editedLead.email}
                        onChange={(e) => setEditedLead(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone Number</FormLabel>
                      <PhoneInput
                        value={editedLead.phone_number || ''}
                        onChange={(value) => setEditedLead(prev => ({
                          ...prev,
                          phone_number: value
                        }))}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Company</FormLabel>
                      <Input
                        value={editedLead.company_name || ''}
                        onChange={(e) => setEditedLead(prev => ({
                          ...prev,
                          company_name: e.target.value
                        }))}
                      />
                    </FormControl>
                  </Grid>
                  <HStack>
                    <Button
                      leftIcon={<FiCheck />}
                      colorScheme="green"
                      onClick={handleSave}
                      isLoading={isUpdating}
                      size="sm"
                    >
                      Save Changes
                    </Button>
                    <Button
                      leftIcon={<FiX />}
                      onClick={handleCancel}
                      size="sm"
                      variant="ghost"
                      _hover={{ bg: 'whiteAlpha.200' }}
                    >
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Heading size={{ base: "md", md: "lg" }} color="white">
                      {lead.first_name} {lead.last_name}
                    </Heading>
                    <Text color="whiteAlpha.900" fontSize="sm">
                      {lead.company_name}
                    </Text>
                  </VStack>
                  <Tooltip label="Edit Lead Information">
                    <IconButton
                      icon={<FiEdit2 />}
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      color="white"
                      _hover={{ bg: 'whiteAlpha.200' }}
                    />
                  </Tooltip>
                </HStack>
              )}
            </Box>

            <CardBody p={6}>
              <VStack spacing={6} align="stretch">
                {/* Status Section */}
                <Box 
                  bg="gray.50" 
                  p={4} 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                >
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
                      px={4}
                      py={2}
                      borderRadius="full"
                      textTransform="capitalize"
                    >
                      {lead.status}
                    </Badge>
                  </Stack>
                </Box>

                {/* Contact Information */}
                <Box>
                  <Heading size="sm" mb={4} color="brand.teal">Contact Information</Heading>
                  <VStack 
                    spacing={4} 
                    align="stretch"
                    bg="white"
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="gray.100"
                  >
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                      <Box>
                        <Text color="gray.600" fontSize="sm">Name</Text>
                        <Text fontSize="lg" fontWeight="medium">
                          {lead.first_name} {lead.last_name}
                        </Text>
                      </Box>
                      <Box>
                        <Text color="gray.600" fontSize="sm">Email</Text>
                        <Text fontSize="lg">{lead.email}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.600" fontSize="sm">Phone</Text>
                        <Text fontSize="lg">{lead.phone_number || 'Not provided'}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.600" fontSize="sm">Company</Text>
                        <Text fontSize="lg">{lead.company_name || 'Not provided'}</Text>
                      </Box>
                    </Grid>
                  </VStack>
                </Box>

                {/* Actions */}
                <Box>
                  <Heading size="sm" mb={4} color="brand.teal">Actions</Heading>
                  <Stack 
                    direction={{ base: "column", md: "row" }} 
                    spacing={4}
                    w="full"
                  >
                    <Button
                      leftIcon={<FiMail />}
                      flex={1}
                      size="lg"
                      bgGradient="linear(to-r, brand.teal, brand.blue)"
                      color="white"
                      onClick={handleSendEmail}
                      _hover={{
                        bgGradient: 'linear(to-r, brand.tealHover, brand.blueHover)',
                        transform: 'translateY(-1px)',
                      }}
                    >
                      Send Email
                    </Button>
                    <Button
                      leftIcon={<FiPhone />}
                      flex={1}
                      size="lg"
                      bgGradient="linear(to-r, brand.teal, brand.blue)"
                      color="white"
                      onClick={handleMakeCall}
                      _hover={{
                        bgGradient: 'linear(to-r, brand.tealHover, brand.blueHover)',
                        transform: 'translateY(-1px)',
                      }}
                    >
                      Make Call
                    </Button>
                    <Button
                      leftIcon={<FiMessageSquare />}
                      flex={1}
                      size="lg"
                      bgGradient="linear(to-r, brand.teal, brand.blue)"
                      color="white"
                      onClick={handleSendWhatsApp}
                      _hover={{
                        bgGradient: 'linear(to-r, brand.tealHover, brand.blueHover)',
                        transform: 'translateY(-1px)',
                      }}
                    >
                      Send WhatsApp
                    </Button>
                  </Stack>
                </Box>

                {/* Lead Activity */}
                <Box>
                  <Heading size="sm" mb={4} color="brand.teal">Lead Activity</Heading>
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

          {/* Status Update Dialog */}
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
      </CardComponent>
    </PageContainer>
  )
}

export default LeadCard 