import { VStack, Text, List, ListItem, HStack, Badge, Box, Spinner, useMediaQuery, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Card from './Card'
import { FiClock, FiUser, FiBriefcase, FiUsers } from 'react-icons/fi'

function RecentLeads() {
  const [isLargerThan1024] = useMediaQuery('(min-width: 1024px)')
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(10) // Show 10 leads by default

  useEffect(() => {
    fetchRecentLeads()
  }, [])

  const fetchRecentLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20) // Fetch more leads for "Show More"

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

  // Format date to show how long ago
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        return `${diffMinutes}m ago`
      }
      return `${diffHours}h ago`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Don't render on mobile/tablet
  if (!isLargerThan1024) {
    return null
  }

  return (
    <Box 
      position="fixed"
      top="80px"  // Add space for the search bar
      right="0"
      width="300px"
      height="calc(100vh - 80px)"  // Subtract search bar height
      borderLeft="1px solid"
      borderColor="gray.200"
      bg="white"
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CBD5E0',
          borderRadius: '24px',
        },
      }}
    >
      <Box p={4}>
        <Card p={0}>
          <VStack align="stretch" spacing={3}>
            <Box px={4} pt={3} pb={2}>
              <HStack justify="space-between" align="center">
                <HStack spacing={2}>
                  <Box
                    borderRadius="full"
                    bg="blue.50"
                    w="28px"
                    h="28px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiUser 
                      size={14} 
                      style={{ color: 'var(--chakra-colors-blue-500)' }}
                    />
                  </Box>
                  <VStack spacing={0} align="flex-start">
                    <Text 
                      fontSize="14px"
                      fontWeight="600"
                      color="gray.700"
                    >
                      Recent Leads
                    </Text>
                    <Text fontSize="12px" color="gray.500">
                      {formatDate(new Date())}
                    </Text>
                  </VStack>
                </HStack>
                <Badge 
                  bg="blue.50"
                  color="blue.600"
                  fontSize="12px"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  {leads.length} TOTAL
                </Badge>
              </HStack>
            </Box>
            
            <Box px={4} pb={4}>
              {loading ? (
                <Box py={4} textAlign="center">
                  <Spinner size="sm" />
                </Box>
              ) : (
                <List spacing={3}>
                  {leads.slice(0, displayCount).map((lead) => (
                    <ListItem
                      key={lead.id}
                      onClick={() => handleLeadClick(lead.id)}
                      cursor="pointer"
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      _hover={{ 
                        bg: 'gray.50',
                        borderColor: 'blue.200',
                        transform: 'translateY(-1px)',
                        boxShadow: 'sm'
                      }}
                      transition="all 0.2s"
                      role="group"
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <HStack>
                            <Box
                              p={2}
                              borderRadius="full"
                              bg={`${getStatusColor(lead.status)}.50`}
                            >
                              <FiUser 
                                size={14} 
                                color={`var(--chakra-colors-${getStatusColor(lead.status)}-500)`}
                              />
                            </Box>
                            <Text 
                              fontWeight="medium" 
                              noOfLines={1}
                              _groupHover={{ color: 'blue.500' }}
                            >
                              {lead.first_name} {lead.last_name}
                            </Text>
                          </HStack>
                          <Badge 
                            colorScheme={getStatusColor(lead.status)}
                            variant="subtle"
                          >
                            {lead.status}
                          </Badge>
                        </HStack>
                        
                        {lead.company_name && (
                          <HStack fontSize="sm" color="gray.600" spacing={2}>
                            <FiBriefcase size={12} />
                            <Text noOfLines={1}>{lead.company_name}</Text>
                          </HStack>
                        )}
                        
                        <HStack fontSize="xs" color="gray.500" spacing={2}>
                          <FiClock size={12} />
                          <Text>{formatDate(lead.created_at)}</Text>
                        </HStack>
                      </VStack>
                    </ListItem>
                  ))}
                </List>
              )}
              
              {leads.length > displayCount && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDisplayCount(prev => prev + 10)}
                  color="blue.500"
                  _hover={{ bg: 'blue.50' }}
                >
                  Show More
                </Button>
              )}
            </Box>
          </VStack>
        </Card>
      </Box>
    </Box>
  )
}

export default RecentLeads 