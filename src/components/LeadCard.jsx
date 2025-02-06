import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { PageContainer } from '../components/PageContainer'
import { Center, Spinner, Card, VStack, Text, Button } from '@chakra-ui/react'
import { FiAlertCircle } from 'react-icons/fi'

function LeadCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLead()
  }, [id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: supabaseError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (supabaseError) throw supabaseError

      if (!data) {
        throw new Error('Lead not found')
      }

      setLead(data)
    } catch (error) {
      setError(error.message)
      toast({
        title: 'Error loading lead',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Center h="200px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <Card p={8}>
          <VStack spacing={4}>
            <Icon as={FiAlertCircle} boxSize={8} color="red.500" />
            <Text fontSize="lg" fontWeight="medium">
              Error Loading Lead
            </Text>
            <Text color="gray.600">{error}</Text>
            <Button onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </VStack>
        </Card>
      </PageContainer>
    )
  }

  // ... rest of the component
}

export default LeadCard 