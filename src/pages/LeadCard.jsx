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
} from '@chakra-ui/react'
import { useParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { 
  FiMail, 
  FiPhone, 
  FiBriefcase, 
  FiMessageSquare,
  FiClock
} from 'react-icons/fi'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function LeadCard() {
  const { id } = useParams()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()
  const [selectedStatus, setSelectedStatus] = useState(null)

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'lost', label: 'Lost' },
    { value: 'won', label: 'Won' },
  ]

  useEffect(() => {
    fetchLead()
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

  const confirmStatusUpdate = async () => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: selectedStatus })
        .eq('id', id)

      if (error) throw error

      setLead(prev => ({
        ...prev,
        status: selectedStatus
      }))

      toast({
        title: 'Status updated',
        description: `Lead status updated to ${selectedStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error updating status',
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

  if (loading) {
    return <Box p={6}>Loading...</Box>
  }

  if (!lead) {
    return <Box p={6}>Lead not found</Box>
  }

  return (
    <Box p={6}>
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Header with Name and Status */}
            <Box>
              <Heading size="lg" mb={2}>
                {lead.first_name} {lead.last_name}
              </Heading>
              <HStack align="center" spacing={4}>
                <Text fontWeight="500" color="gray.700">Status:</Text>
                <Select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  width="200px"
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
              </HStack>
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
              <HStack spacing={4}>
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
              </HStack>
            </Box>

            <Divider />

            {/* Lead Activity */}
            <Box>
              <Heading size="sm" mb={4}>Lead Activity</Heading>
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Icon as={FiClock} color="gray.500" />
                  <Text>
                    Created on {new Date(lead.created_at).toLocaleDateString()}
                  </Text>
                </HStack>
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
                onClick={confirmStatusUpdate} 
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