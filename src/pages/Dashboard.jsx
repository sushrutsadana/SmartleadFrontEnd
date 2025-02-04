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
  SimpleGrid,
} from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import { typography } from '../theme/constants'
import { supabase } from '../supabaseClient'

const supabaseClient = createClient(
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
  const [stats, setStats] = useState({
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeadsData()
    fetchStats()
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
      const { data, error } = await supabaseClient
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

  const fetchStats = async () => {
    try {
      // Get all leads
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')

      if (error) throw error

      // Calculate stats
      const newLeads = leads?.filter(lead => lead.status === 'new').length || 0
      const contactedLeads = leads?.filter(lead => lead.status === 'contacted').length || 0
      const qualifiedLeads = leads?.filter(lead => lead.status === 'qualified').length || 0

      setStats({ newLeads, contactedLeads, qualifiedLeads })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Text>Loading stats...</Text>

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your lead generation and conversion metrics"
      />

      {/* Date Range Selector */}
      <HStack spacing={4} mb={6}>
        <Select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          w="200px"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </Select>
      </HStack>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Stat>
          <StatLabel>New Leads</StatLabel>
          <StatNumber>{stats.newLeads}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Contacted Leads</StatLabel>
          <StatNumber>{stats.contactedLeads}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Qualified Leads</StatLabel>
          <StatNumber>{stats.qualifiedLeads}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Lead Status Trends */}
      <Card>
        <Text {...typography.heading.section} mb={6}>
          Lead Status Trends
        </Text>
        <Box h="400px">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={leadsData.new} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                type="category"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis allowDecimals={false} />
              <Tooltip 
                formatter={(value) => [value, 'Leads']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                data={leadsData.new}
                dataKey="count" 
                name="New Leads" 
                stroke="#00838F" 
                strokeWidth={2}
                dot={{ r: 4 }}
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