import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Button,
  HStack,
  useToast,
  Spinner,
  Text,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import PageLayoutWithSidebar from '../components/PageLayoutWithSidebar'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function Database() {
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const cancelRef = React.useRef()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const statusParam = params.get('status')
    if (statusParam) {
      setSelectedStatus(statusParam)
    }
  }, [location])

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        
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

  const getStatusColor = (status) => {
    const colors = {
      'new': 'blue',
      'contacted': 'yellow',
      'qualified': 'green',
      'lost': 'red',
      'won': 'purple'
    }
    return colors[status?.toLowerCase()] || 'gray'
  }

  const handleEdit = (leadId) => {
    console.log('Edit lead:', leadId)
    // Implement edit functionality
  }

  const handleDelete = async (lead) => {
    setLeadToDelete(lead)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      // First delete all activities associated with this lead
      const { error: activitiesError } = await supabase
        .from('activities')
        .delete()
        .eq('lead_id', leadToDelete.id)

      if (activitiesError) throw activitiesError

      // Then delete the lead
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id)

      if (leadError) throw leadError

      toast({
        title: 'Lead deleted',
        description: 'The lead and all associated activities have been deleted',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh leads list
      fetchLeads()
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  const handleViewLead = (leadId) => {
    navigate(`/lead/${leadId}`)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Lead Database"
        description="View and manage all your leads"
      />
      
      <Card mb={6}>
        <HStack p={4} spacing={4} overflowX="auto">
          <Text fontWeight="medium">Filter by Status:</Text>
          {['all', 'new', 'contacted', 'qualified', 'lost', 'won'].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={selectedStatus === status ? 'solid' : 'outline'}
              colorScheme={
                status === 'new' ? 'blue' :
                status === 'contacted' ? 'yellow' :
                status === 'qualified' ? 'green' :
                status === 'lost' ? 'red' :
                status === 'won' ? 'purple' :
                'gray'
              }
              onClick={() => {
                setSelectedStatus(status)
                // Update URL without page reload
                const newUrl = status === 'all' 
                  ? '/database'
                  : `/database?status=${status}`
                window.history.pushState({}, '', newUrl)
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </HStack>
      </Card>

      <Card>
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {leads
                .filter(lead => selectedStatus === 'all' || lead.status === selectedStatus)
                .map((lead) => (
                  <Tr key={lead.id}>
                    <Td>{lead.first_name} {lead.last_name}</Td>
                    <Td>{lead.company_name}</Td>
                    <Td>{lead.email}</Td>
                    <Td>{lead.phone}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FiEdit2 />}
                          onClick={() => handleViewLead(lead.id)}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="blue"
                          onClick={() => handleEdit(lead.id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          colorScheme="red"
                          onClick={() => handleDelete(lead)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>

          {leads.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No leads found</Text>
            </Box>
          ) : leads.filter(lead => selectedStatus === 'all' || lead.status === selectedStatus).length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No leads found with status: {selectedStatus}</Text>
            </Box>
          ) : null}
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Lead
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {leadToDelete?.first_name} {leadToDelete?.last_name}? 
              This will also delete all associated activities and cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </PageContainer>
  )
}

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 0V4L11 2L8 0Z" fill="currentColor"/>
  </svg>
)

export default Database 