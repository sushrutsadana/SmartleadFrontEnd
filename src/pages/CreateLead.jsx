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
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
} from '@chakra-ui/react'
import axios from 'axios'

function CreateLead() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    linkedin_url: '',
    status: 'new'
  })
  const toast = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.post('/leads', formData)
      
      toast({
        title: 'Lead Created',
        description: 'New lead has been successfully created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        linkedin_url: '',
        status: 'new'
      })
    } catch (error) {
      console.error('Create lead error:', error.response || error)
      toast({
        title: 'Error Creating Lead',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.xl" p={4}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Create Lead</Heading>

        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Box>
                <Heading size="md">New Lead Information</Heading>
                <Text color="gray.600" mt={2}>
                  Enter the details for the new lead
                </Text>
              </Box>
            </HStack>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="John"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Acme Inc."
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <Input
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                    <option value="won">Won</option>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Creating Lead"
                  bg="transparent"
                  border="1px solid"
                  borderColor="gray.200"
                  color="brand.textDark"
                  _hover={{
                    bg: 'brand.gradient.primary',
                    color: 'white',
                    borderColor: 'transparent'
                  }}
                >
                  Create Lead
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export default CreateLead