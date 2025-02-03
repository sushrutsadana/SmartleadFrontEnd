import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Select,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import { typography } from '../theme/constants'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function Dashboard() {
  const [dateRange, setDateRange] = useState('7days') // '7days', '30days', '90days'
  const [leadsData, setLeadsData] = useState({
    new: [],
    contacted: [],
    qualified: []
  })
  const [totals, setTotals] = useState({
    new: 0,
    contacted: 0,
    qualified: 0
  })

  useEffect(() => {
    fetchLeadsData()
  }, [dateRange])

  const fetchLeadsData = async () => {
    const daysAgo = {
      '7days': 7,
      '30days': 30,
      '90days': 90
    }[dateRange]

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    
    try {
      // Fetch leads with created_at and status
      const { data, error } = await supabase
        .from('leads')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Process data for visualization
      const processedData = processLeadsData(data, daysAgo)
      setLeadsData(processedData)

      // Calculate totals
      const newTotal = data.filter(lead => lead.status === 'new').length
      const contactedTotal = data.filter(lead => lead.status === 'contacted').length
      const qualifiedTotal = data.filter(lead => lead.status === 'qualified').length

      setTotals({
        new: newTotal,
        contacted: contactedTotal,
        qualified: qualifiedTotal
      })

    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }

  const processLeadsData = (data, days) => {
    const dateLabels = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      return date.toISOString().split('T')[0]
    })

    const processed = {
      new: [],
      contacted: [],
      qualified: []
    }

    dateLabels.forEach(date => {
      const dayData = data.filter(lead => 
        lead.created_at.split('T')[0] === date
      )

      processed.new.push({
        date,
        count: dayData.filter(lead => lead.status === 'new').length
      })
      processed.contacted.push({
        date,
        count: dayData.filter(lead => lead.status === 'contacted').length
      })
      processed.qualified.push({
        date,
        count: dayData.filter(lead => lead.status === 'qualified').length
      })
    })

    return processed
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your lead generation and conversion metrics"
      />

      {/* Stats Grid */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
        <Card>
          <VStack align="start" spacing={2}>
            <Text {...typography.body.small} color="gray.600">
              New Leads
            </Text>
            <Text {...typography.heading.secondary}>
              {totals.new}
            </Text>
            <Text {...typography.body.small} color="gray.500">
              In selected period
            </Text>
          </VStack>
        </Card>

        <Card>
          <VStack align="start" spacing={2}>
            <Text {...typography.body.small} color="gray.600">
              Contacted Leads
            </Text>
            <Text {...typography.heading.secondary}>
              {totals.contacted}
            </Text>
            <Text {...typography.body.small} color="gray.500">
              In selected period
            </Text>
          </VStack>
        </Card>

        <Card>
          <VStack align="start" spacing={2}>
            <Text {...typography.body.small} color="gray.600">
              Qualified Leads
            </Text>
            <Text {...typography.heading.secondary}>
              {totals.qualified}
            </Text>
            <Text {...typography.body.small} color="gray.500">
              In selected period
            </Text>
          </VStack>
        </Card>
      </Grid>

      {/* Lead Status Trends */}
      <Card>
        <Text {...typography.heading.section} mb={6}>
          Lead Status Trends
        </Text>
        <Box h="400px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                type="category"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                data={leadsData.new}
                dataKey="count" 
                name="New Leads" 
                stroke="#00838F" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                data={leadsData.contacted}
                dataKey="count" 
                name="Contacted" 
                stroke="#2B3990" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                data={leadsData.qualified}
                dataKey="count" 
                name="Qualified" 
                stroke="#00A3B3" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </PageContainer>
  )
}

export default Dashboard 