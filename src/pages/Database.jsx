import { useState, useEffect } from 'react'
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
  Badge
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { FiEdit2 } from 'react-icons/fi'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function Database() {
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

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

  const handleDelete = (leadId) => {
    console.log('Delete lead:', leadId)
    // Implement delete functionality
  }

  const handleViewLead = (leadId) => {
    navigate(`/leads/${leadId}`)
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Database"
        description="Manage your leads database"
      />
      
      <Card>
        <Box borderWidth="1px" borderRadius="lg" p={6}>
          <HStack justify="space-between" mb={6}>
            <Heading size="lg">Database</Heading>
            <Button 
              colorScheme="blue" 
              onClick={fetchLeads} 
              isLoading={isLoading}
              leftIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </HStack>

          {isLoading ? (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" />
              <Text mt={4}>Loading leads...</Text>
            </Box>
          ) : leads.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text>No leads found</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Company</Th>
                  <Th>LinkedIn URL</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {leads.map((lead) => (
                  <Tr key={lead.id}>
                    <Td>{lead.first_name} {lead.last_name}</Td>
                    <Td>{lead.email}</Td>
                    <Td>{lead.company_name}</Td>
                    <Td>
                      {lead.linkedin_url && (
                        <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="link">
                            View Profile
                          </Button>
                        </a>
                      )}
                    </Td>
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
                          onClick={() => handleDelete(lead.id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Card>
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