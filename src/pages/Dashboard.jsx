import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import {
  Box,
  SimpleGrid,
  Text,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  HStack,
  VStack,
  Divider,
  Grid,
  Spinner,
  Center
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FiMail, FiMessageSquare, FiPhone, FiUser, FiUserCheck, FiUserPlus, FiUsers, FiCheckCircle, FiMessageCircle, FiStar } from 'react-icons/fi'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// Add chartOptions constant before the Dashboard function
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  },
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
}

function Dashboard() {
  const [timeRange, setTimeRange] = useState('7')
  const [stats, setStats] = useState({
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    totalEmails: 0,
    totalWhatsApp: 0,
    totalCalls: 0,
    contactRate: 0,
    qualificationRate: 0
  })
  const [chartData, setChartData] = useState(null)
  const [leadSourceData, setLeadSourceData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (leadsError) throw leadsError

      // Fetch activities for the period
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .gte('activity_datetime', startDate.toISOString())
        .lte('activity_datetime', endDate.toISOString())

      if (activitiesError) throw activitiesError

      // Calculate stats
      const stats = {
        newLeads: leads?.filter(l => l.status === 'new').length || 0,
        contactedLeads: leads?.filter(l => l.status === 'contacted').length || 0,
        qualifiedLeads: leads?.filter(l => l.status === 'qualified').length || 0,
        totalEmails: activities?.filter(a => a.activity_type === 'email_sent').length || 0,
        totalWhatsApp: activities?.filter(a => a.activity_type === 'whatsapp_sent').length || 0,
        totalCalls: activities?.filter(a => 
          a.activity_type === 'call_made' || a.activity_type === 'call_scheduled'
        ).length || 0,
        contactRate: 0,
        qualificationRate: 0
      }

      // Calculate rates
      if (stats.newLeads > 0) {
        stats.contactRate = Math.round((stats.contactedLeads / stats.newLeads) * 100)
      }
      if (stats.contactedLeads > 0) {
        stats.qualificationRate = Math.round((stats.qualifiedLeads / stats.contactedLeads) * 100)
      }

      setStats(stats)

      // Prepare chart data
      const dates = [...Array(parseInt(timeRange))].map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (parseInt(timeRange) - 1 - i))
        return date.toISOString().split('T')[0]
      })

      const chartData = {
        labels: dates,
        datasets: [
          {
            label: 'New Leads',
            data: dates.map(date => 
              leads?.filter(l => l.created_at.startsWith(date) && l.status === 'new').length || 0
            ),
            borderColor: '#00838F',
            tension: 0.4
          },
          {
            label: 'Contacted',
            data: dates.map(date => 
              leads?.filter(l => l.created_at.startsWith(date) && l.status === 'contacted').length || 0
            ),
            borderColor: '#2B3990',
            tension: 0.4
          },
          {
            label: 'Qualified',
            data: dates.map(date => 
              leads?.filter(l => l.created_at.startsWith(date) && l.status === 'qualified').length || 0
            ),
            borderColor: '#38A169',
            tension: 0.4
          }
        ]
      }

      setChartData(chartData)

      // Fetch lead source data
      const sourceData = await fetchLeadSourceData()
      setLeadSourceData(sourceData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchLeadSourceData = async () => {
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      const { data, error } = await supabase
        .from('leads')
        .select('lead_source')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) throw error

      const sourceCounts = data.reduce((acc, lead) => {
        const source = lead.lead_source || 'Direct'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {})

      return {
        labels: Object.keys(sourceCounts),
        datasets: [{
          data: Object.values(sourceCounts),
          backgroundColor: [
            '#00838F',  // teal
            '#2B3990',  // blue
            '#4CAF50',  // green
            '#FFC107',  // yellow
            '#FF5722',  // orange
            '#9C27B0',  // purple
          ],
          borderWidth: 1,
          label: 'Lead Sources'
        }]
      }
    } catch (error) {
      console.error('Error fetching lead source data:', error)
      return null
    }
  }

  const handleMetricClick = (type) => {
    switch(type) {
      case 'new':
        navigate('/database?status=new')
        break
      case 'contacted':
        navigate('/database?status=contacted')
        break
      case 'qualified':
        navigate('/database?status=qualified')
        break
      case 'emails':
        navigate('/reports?type=email_sent')
        break
      case 'whatsapp':
        navigate('/reports?type=whatsapp_sent')
        break
      case 'calls':
        navigate('/reports?type=call_scheduled')
        break
      default:
        navigate('/database')
    }
  }

  const StatCard = ({ title, value, icon, helpText, onClick, isDisabled }) => (
    <Card 
      p={6}
      cursor={isDisabled ? 'default' : 'pointer'}
      transition="all 0.2s"
      _hover={!isDisabled && { transform: 'translateY(-2px)', shadow: 'md' }}
      onClick={!isDisabled ? onClick : undefined}
      opacity={isDisabled ? 0.7 : 1}
    >
      <VStack align="start" spacing={2}>
        <HStack spacing={3}>
          <Icon as={icon} boxSize={5} color={isDisabled ? 'gray.400' : 'blue.500'} />
          <Text color={isDisabled ? 'gray.400' : 'gray.500'} fontSize="sm">
            {title}
          </Text>
        </HStack>
        <Text fontSize="3xl" fontWeight="bold" color={isDisabled ? 'gray.400' : 'inherit'}>
          {value}
        </Text>
        {helpText && (
          <Text fontSize="sm" color={isDisabled ? 'gray.400' : 'gray.500'}>
            {helpText}
          </Text>
        )}
      </VStack>
    </Card>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your lead generation and conversion metrics"
      />

      {/* Date Range Filter Card */}
      <Box px={6} mb={6}>
        <Card>
          <HStack p={4} justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">Date Range</Text>
              <Text fontSize="sm" color="gray.600">
                Filter dashboard metrics by time period
              </Text>
            </VStack>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              w="200px"
              size="md"
              bg="white"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
            </Select>
          </HStack>
        </Card>
      </Box>

      <Box px={6}>
        <VStack spacing={6} align="stretch">
          {/* Conversion Stats */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <StatCard
              title="Contact Rate"
              value={`${stats.contactRate}%`}
              icon={FiUsers}
              helpText={`${stats.contactedLeads} out of ${stats.newLeads} new leads`}
              onClick={() => handleMetricClick('contacted')}
            />
            <StatCard
              title="Qualification Rate"
              value={`${stats.qualificationRate}%`}
              icon={FiCheckCircle}
              helpText={`${stats.qualifiedLeads} out of ${stats.contactedLeads} contacted leads`}
              onClick={() => handleMetricClick('qualified')}
            />
          </SimpleGrid>

          {/* Lead Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <StatCard
              title="New Leads"
              value={stats.newLeads}
              icon={FiUserPlus}
              helpText="Total new leads acquired"
              onClick={() => handleMetricClick('new')}
            />
            <StatCard
              title="Contacted Leads"
              value={stats.contactedLeads}
              icon={FiMessageCircle}
              helpText="Leads that have been contacted"
              onClick={() => handleMetricClick('contacted')}
            />
            <StatCard
              title="Qualified Leads"
              value={stats.qualifiedLeads}
              icon={FiStar}
              helpText="Leads qualified for conversion"
              onClick={() => handleMetricClick('qualified')}
            />
          </SimpleGrid>

          {/* Activity Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <StatCard
              title="Emails Sent"
              value={stats.totalEmails}
              icon={FiMail}
              helpText="Total emails sent to leads"
              onClick={() => handleMetricClick('emails')}
            />
            <StatCard
              title="WhatsApp Messages"
              value={stats.totalWhatsApp}
              icon={FiMessageSquare}
              helpText="Total WhatsApp messages sent"
              onClick={() => handleMetricClick('whatsapp')}
            />
            <StatCard
              title="Calls Made"
              value={stats.totalCalls}
              icon={FiPhone}
              helpText="Total calls initiated"
              onClick={() => handleMetricClick('calls')}
            />
          </SimpleGrid>

          {/* Charts */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
            {/* Lead Status Trends chart */}
            <Card>
              <VStack align="start" spacing={2} p={6}>
                <Text fontSize="lg" fontWeight="semibold">
                  Lead Status Trends
                </Text>
                <Box w="full" h="300px">
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </Box>
              </VStack>
            </Card>

            {/* Lead Sources chart */}
            <Card>
              <VStack align="start" spacing={2} p={6}>
                <Text fontSize="lg" fontWeight="semibold">
                  Lead Sources
                </Text>
                <Box w="full" h="300px" position="relative">
                  {leadSourceData ? (
                    <Pie
                      data={leadSourceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              usePointStyle: true,
                              padding: 20
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || ''
                                const value = context.raw || 0
                                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                                const percentage = Math.round((value / total) * 100)
                                return `${label}: ${value} (${percentage}%)`
                              }
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Center h="full">
                      <Spinner />
                    </Center>
                  )}
                </Box>
              </VStack>
            </Card>
          </SimpleGrid>
        </VStack>
      </Box>
    </PageContainer>
  )
}

export default Dashboard