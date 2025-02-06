import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  Select,
  useToast,
  Spinner,
} from '@chakra-ui/react'
import { FiMail, FiPhone, FiMessageSquare } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

function Reports() {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activityType, setActivityType] = useState('all')
  const [timeRange, setTimeRange] = useState('7') // Default to 7 days
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const type = params.get('type')
    if (type) {
      setActivityType(type)
    }
    fetchActivities(type || 'all')
  }, [location, timeRange]) // Add timeRange dependency

  const fetchActivities = async (type) => {
    setIsLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      let query = supabase
        .from('activities')
        .select(`
          *,
          lead:lead_id (
            id,
            first_name,
            last_name,
            company_name,
            email
          )
        `)
        .gte('activity_datetime', startDate.toISOString())
        .lte('activity_datetime', endDate.toISOString())
        .order('activity_datetime', { ascending: false })

      if (type && type !== 'all') {
        if (type === 'call_scheduled') {
          // Include both call types
          query = query.in('activity_type', ['call_made', 'call_scheduled'])
        } else {
          query = query.eq('activity_type', type)
        }
      }

      const { data, error } = await query

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
      setIsLoading(false)
    }
  }

  const handleFilterChange = (type) => {
    setActivityType(type)
    const newUrl = type === 'all' ? '/reports' : `/reports?type=${type}`
    navigate(newUrl)
  }

  // Add a helper function to format activity types for display
  const formatActivityType = (type) => {
    switch(type) {
      case 'email_sent':
        return 'EMAIL SENT'
      case 'whatsapp_sent':
        return 'WHATSAPP SENT'
      case 'call_made':
        return 'CALL MADE'
      case 'call_scheduled':
        return 'CALL SCHEDULED'
      default:
        return type.replace(/_/g, ' ').toUpperCase()
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Activity Reports"
        description="View detailed activity logs and metrics"
      />

      <Card mb={6}>
        <VStack spacing={4} p={4}>
          {/* Date Range Filter */}
          <HStack w="full" justify="space-between">
            <Text fontWeight="medium">Date Range:</Text>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              w="200px"
              size="sm"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </Select>
          </HStack>

          {/* Activity Type Filter */}
          <HStack w="full" spacing={4} overflowX="auto">
            <Text fontWeight="medium">Filter by Type:</Text>
            <Button
              size="sm"
              variant={activityType === 'all' ? 'solid' : 'outline'}
              colorScheme="gray"
              onClick={() => handleFilterChange('all')}
            >
              All Activities
            </Button>
            <Button
              size="sm"
              variant={activityType === 'email_sent' ? 'solid' : 'outline'}
              colorScheme="blue"
              leftIcon={<FiMail />}
              onClick={() => handleFilterChange('email_sent')}
            >
              Emails
            </Button>
            <Button
              size="sm"
              variant={activityType === 'call_scheduled' ? 'solid' : 'outline'}
              colorScheme="purple"
              leftIcon={<FiPhone />}
              onClick={() => handleFilterChange('call_scheduled')}
            >
              Calls
            </Button>
            <Button
              size="sm"
              variant={activityType === 'whatsapp_sent' ? 'solid' : 'outline'}
              colorScheme="green"
              leftIcon={<FiMessageSquare />}
              onClick={() => handleFilterChange('whatsapp_sent')}
            >
              WhatsApp
            </Button>
          </HStack>
        </VStack>
      </Card>

      <Card>
        <Box overflowX="auto">
          {isLoading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" />
              <Text mt={4}>Loading activities...</Text>
            </Box>
          ) : activities.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No activities found for the selected filters</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date & Time</Th>
                  <Th>Type</Th>
                  <Th>Lead</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activities.map((activity) => (
                  <Tr key={activity.id}>
                    <Td>{new Date(activity.activity_datetime).toLocaleString()}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          activity.activity_type === 'email_sent' ? 'blue' :
                          activity.activity_type.includes('call') ? 'purple' :
                          activity.activity_type === 'whatsapp_sent' ? 'green' :
                          'gray'
                        }
                      >
                        {formatActivityType(activity.activity_type)}
                      </Badge>
                    </Td>
                    <Td>
                      <Text>
                        {activity.lead?.first_name} {activity.lead?.last_name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {activity.lead?.company_name}
                      </Text>
                    </Td>
                    <Td maxW="400px">
                      <Text noOfLines={2}>{activity.body}</Text>
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

export default Reports 