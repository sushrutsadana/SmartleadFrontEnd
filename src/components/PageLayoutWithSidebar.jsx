import { Grid, VStack, Text, List, ListItem, HStack, Badge, Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Card from './Card'
import { useNavigate } from 'react-router-dom'

function PageLayoutWithSidebar({ children }) {
  const [recentLeads, setRecentLeads] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecentLeads()
  }, [])

  const fetchRecentLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentLeads(data)
    } catch (error) {
      console.error('Error fetching recent leads:', error)
    }
  }

  return (
    <Grid templateColumns="1fr 300px" gap={6}>
      {/* Main Content */}
      <Box>{children}</Box>

      {/* Right Sidebar */}
      <Card>
        <VStack align="stretch" spacing={4} p={4}>
          <Text fontWeight="semibold" fontSize="lg">
            Recent Leads
          </Text>
          
          <List spacing={3}>
            {recentLeads.map((lead) => (
              <ListItem
                key={lead.id}
                onClick={() => navigate(`/lead/${lead.id}`)}
                p={3}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ borderColor: 'blue.200', bg: 'gray.50' }}
              >
                <VStack align="stretch" spacing={1}>
                  <HStack justify="space-between">
                    <Text fontWeight="medium">
                      {lead.first_name} {lead.last_name}
                    </Text>
                    <Badge colorScheme={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {lead.company_name || 'No company'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Added {new Date(lead.created_at).toLocaleDateString()}
                  </Text>
                </VStack>
              </ListItem>
            ))}
          </List>
        </VStack>
      </Card>
    </Grid>
  )
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

export default PageLayoutWithSidebar 