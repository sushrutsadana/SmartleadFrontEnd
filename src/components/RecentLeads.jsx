import { VStack, Text, List, ListItem, HStack, Badge, Box, Spinner, useMediaQuery } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Card from './Card'

function RecentLeads() {
  const [isLargerThan1024] = useMediaQuery('(min-width: 1024px)')
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

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
      setLeads(data)
    } catch (error) {
      console.error('Error fetching recent leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = (id) => {
    navigate(`/lead/${id}`)
  }

  // Don't render on mobile/tablet
  if (!isLargerThan1024) {
    return null
  }

  return (
    <Box 
      p={4}
      position="sticky"
      top="0"
    >
      <Card>
        <VStack align="stretch" spacing={3} p={4}>
          <Text fontWeight="semibold" fontSize="lg">
            Recent Leads
          </Text>
          
          {loading ? (
            <Box py={4} textAlign="center">
              <Spinner size="sm" />
            </Box>
          ) : (
            <List spacing={2}>
              {leads.map((lead) => (
                <ListItem
                  key={lead.id}
                  onClick={() => handleLeadClick(lead.id)}
                  cursor="pointer"
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: 'gray.50' }}
                  role="group"
                >
                  <VStack align="stretch" spacing={1}>
                    <HStack justify="space-between">
                      <Text 
                        fontWeight="medium" 
                        noOfLines={1}
                        _groupHover={{ color: 'blue.500' }}
                      >
                        {lead.first_name} {lead.last_name}
                      </Text>
                      <Badge 
                        size="sm" 
                        colorScheme="blue"
                        variant="subtle"
                      >
                        {lead.status || 'NEW'}
                      </Badge>
                    </HStack>
                    {lead.company_name && (
                      <Text fontSize="xs" color="gray.600" noOfLines={1}>
                        {lead.company_name}
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.500">
                      Added {new Date(lead.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </ListItem>
              ))}
            </List>
          )}
        </VStack>
      </Card>
    </Box>
  )
}

export default RecentLeads 