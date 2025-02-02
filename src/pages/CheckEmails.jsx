import { useState } from 'react'
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
  HStack
} from '@chakra-ui/react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL;

function CheckEmails() {
  const [isProcessing, setIsProcessing] = useState(false)
  const toast = useToast()

  const processEmails = async () => {
    setIsProcessing(true)
    try {
      const response = await axios.post(`${API_URL}/process-emails`);
      
      toast({
        title: 'Emails Processed',
        description: response.data.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error Processing Emails',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Container maxW="container.xl" p={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Check Emails</Heading>

        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">Process New Emails</Heading>
                <Text color="gray.600" mt={2}>
                  Check and process new email leads
                </Text>
              </Box>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={processEmails}
                isLoading={isProcessing}
                loadingText="Processing"
              >
                Process Emails
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text color="gray.600">
              This will check your connected email accounts for new leads and automatically process them into your database.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export default CheckEmails 