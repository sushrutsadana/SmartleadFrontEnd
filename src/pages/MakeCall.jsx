import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useToast,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function MakeCall() {
  const [isLoading, setIsLoading] = useState(false)
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState('')
  const toast = useToast()

  // Fetch leads when component mounts
  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, company_name')
      
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
    }
  }

  const initiateCall = async () => {
    if (!selectedLead) {
      toast({
        title: 'No lead selected',
        description: 'Please select a lead to call',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await axios.post(`/leads/${selectedLead}/call`)
      
      toast({
        title: 'Call Initiated',
        description: response.data.message || 'Call has been initiated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Call error:', error.response || error)
      toast({
        title: 'Error Making Call',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.xl" p={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Make Call</Heading>

        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">Call Lead</Heading>
                <Text color="gray.600" mt={2}>
                  Initiate a call with selected lead
                </Text>
              </Box>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Select Lead</FormLabel>
                <Select
                  placeholder="Choose a lead to call"
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                >
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name} - {lead.company_name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={initiateCall}
                isLoading={isLoading}
                loadingText="Initiating Call"
                bgGradient="brand.gradient.primary"
                _hover={{
                  bgGradient: 'linear(to-r, brand.tealHover, brand.blueHover)'
                }}
              >
                Make Call
              </Button>

              <Text color="gray.600" fontSize="sm">
                This will initiate a call to the selected lead using our integrated calling system.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export default MakeCall
