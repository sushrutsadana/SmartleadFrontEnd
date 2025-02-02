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
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
    <Container maxW="container.xl" p={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Dashboard</Heading>
          <Select
            w="200px"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </Select>
        </HStack>

        {/* Stats Cards */}
        <HStack spacing={4}>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>New Leads</StatLabel>
                <StatNumber>{totals.new}</StatNumber>
                <StatHelpText>In selected period</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>Contacted Leads</StatLabel>
                <StatNumber>{totals.contacted}</StatNumber>
                <StatHelpText>In selected period</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card flex={1}>
            <CardBody>
              <Stat>
                <StatLabel>Qualified Leads</StatLabel>
                <StatNumber>{totals.qualified}</StatNumber>
                <StatHelpText>In selected period</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </HStack>

        {/* Charts */}
        <Card>
          <CardHeader>
            <Heading size="md">Lead Status Trends</Heading>
          </CardHeader>
          <CardBody>
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
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export default Dashboard 