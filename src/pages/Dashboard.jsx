import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
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
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FiMail, FiMessageSquare, FiPhone, FiUser, FiUserCheck, FiUserPlus } from 'react-icons/fi'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { supabase } from '../supabaseClient'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

  useEffect(() => {
    fetchDashboardData()
  }, [timeRange])

  const fetchDashboardData = async () => {
    try {
      // Fetch lead stats
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange))

      const { data: leads } = await supabase
        .from('leads')
        .select('status, created_at')
        .gte('created_at', daysAgo.toISOString())

      // Fetch activity stats
      const { data: activities } = await supabase
        .from('activities')
        .select('activity_type, activity_datetime')
        .gte('activity_datetime', daysAgo.toISOString())

      // Calculate stats
      const newLeads = leads?.filter(l => l.status === 'new').length || 0
      const contactedLeads = leads?.filter(l => l.status === 'contacted').length || 0
      const qualifiedLeads = leads?.filter(l => l.status === 'qualified').length || 0

      const totalEmails = activities?.filter(a => a.activity_type === 'email_sent').length || 0
      const totalWhatsApp = activities?.filter(a => a.activity_type === 'whatsapp_sent').length || 0
      const totalCalls = activities?.filter(a => a.activity_type === 'call_initiated').length || 0

      // Calculate conversion rates
      const contactRate = newLeads > 0 
        ? ((contactedLeads / newLeads) * 100).toFixed(1) 
        : 0
      
      const qualificationRate = contactedLeads > 0 
        ? ((qualifiedLeads / contactedLeads) * 100).toFixed(1)
        : 0

      setStats({
        newLeads,
        contactedLeads,
        qualifiedLeads,
        totalEmails,
        totalWhatsApp,
        totalCalls,
        contactRate,
        qualificationRate
      })

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

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const StatCard = ({ title, value, icon, helpText }) => (
    <Card p={6}>
      <VStack align="start" spacing={2}>
        <HStack spacing={3}>
          <Icon as={icon} boxSize={5} color="blue.500" />
          <Text color="gray.500" fontSize="sm">
            {title}
          </Text>
        </HStack>
        <Text fontSize="3xl" fontWeight="bold">
          {value}
        </Text>
        {helpText && (
          <Text fontSize="sm" color="gray.500">
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
            <Card p={6} bg="blue.50">
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={FiUserPlus} boxSize={5} color="blue.500" />
                  <Text color="blue.800" fontSize="sm" fontWeight="medium">
                    Contact Rate
                  </Text>
                </HStack>
                <HStack align="baseline" spacing={2}>
                  <Text fontSize="3xl" fontWeight="bold" color="blue.800">
                    {stats.contactRate}%
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    of new leads contacted
                  </Text>
                </HStack>
                <Text fontSize="sm" color="blue.600">
                  {stats.contactedLeads} out of {stats.newLeads} new leads
                </Text>
              </VStack>
            </Card>

            <Card p={6} bg="green.50">
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Icon as={FiUserCheck} boxSize={5} color="green.500" />
                  <Text color="green.800" fontSize="sm" fontWeight="medium">
                    Qualification Rate
                  </Text>
                </HStack>
                <HStack align="baseline" spacing={2}>
                  <Text fontSize="3xl" fontWeight="bold" color="green.800">
                    {stats.qualificationRate}%
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    of contacted leads qualified
                  </Text>
                </HStack>
                <Text fontSize="sm" color="green.600">
                  {stats.qualifiedLeads} out of {stats.contactedLeads} contacted leads
                </Text>
              </VStack>
            </Card>
          </SimpleGrid>

          {/* Existing Lead Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <StatCard
              title="New Leads"
              value={stats.newLeads}
              icon={FiUserPlus}
              helpText="Total new leads acquired"
            />
            <StatCard
              title="Contacted Leads"
              value={stats.contactedLeads}
              icon={FiUser}
              helpText="Leads that have been contacted"
            />
            <StatCard
              title="Qualified Leads"
              value={stats.qualifiedLeads}
              icon={FiUserCheck}
              helpText="Leads qualified for conversion"
            />
          </SimpleGrid>

          {/* Activity Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <StatCard
              title="Emails Sent"
              value={stats.totalEmails}
              icon={FiMail}
              helpText="Total emails sent to leads"
            />
            <StatCard
              title="WhatsApp Messages"
              value={stats.totalWhatsApp}
              icon={FiMessageSquare}
              helpText="Total WhatsApp messages sent"
            />
            <StatCard
              title="Calls Made"
              value={stats.totalCalls}
              icon={FiPhone}
              helpText="Total calls initiated"
            />
          </SimpleGrid>

          {/* Chart */}
          <Card p={6}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="lg" fontWeight="medium">
                Lead Status Trends
              </Text>
              {chartData && (
                <Box h="300px">
                  <Line
                    data={chartData}
                    options={{
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
                    }}
                  />
                </Box>
              )}
            </VStack>
          </Card>
        </VStack>
      </Box>
    </PageContainer>
  )
}

export default Dashboard