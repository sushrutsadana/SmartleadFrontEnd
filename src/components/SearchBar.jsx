import { useState, useEffect, useRef } from 'react'
import {
  Box,
  InputGroup,
  InputLeftElement,
  Input,
  InputRightElement,
  Button,
  VStack,
  Text,
  useDisclosure,
  Portal,
} from '@chakra-ui/react'
import { FiSearch, FiUser, FiMail, FiBriefcase } from 'react-icons/fi'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const searchRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .limit(1)
      console.log('Test connection:', { data, error })
    }
    testConnection()
  }, [])

  const searchLeads = async (query) => {
    console.log('Searching for:', query)
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      // Expand search to include all fields
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, company_name')
        .or(`first_name.ilike.%${query}%, last_name.ilike.%${query}%, email.ilike.%${query}%, company_name.ilike.%${query}%`)
        .limit(5)

      console.log('Raw search results:', data) // Log the actual data

      if (error) {
        console.error('Search error:', error)
        throw error
      }

      if (data && data.length > 0) {
        console.log('Found leads:', data.length)
        setResults(data)
      } else {
        console.log('No results found')
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLeads(searchQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (e) => {
    const query = e.target.value
    console.log('Search input:', query) // Debug log
    setSearchQuery(query)
  }

  const handleResultClick = (lead) => {
    navigate(`/leads/${lead.id}`)
    setSearchQuery('')
    setResults([])
  }

  useEffect(() => {
    console.log('Current results:', results)
  }, [results])

  return (
    <Box 
      position="fixed" 
      top={0} 
      left="280px"
      right={0}
      height="70px"
      bg="white"
      borderBottom="1px"
      borderColor="gray.100"
      display="flex"
      alignItems="center"
      px={6}
      zIndex={10}
      boxShadow="sm"
      ref={searchRef}
    >
      <Box
        maxW="600px"
        w="full"
        position="relative"
      >
        <Box
          p="2px"
          borderRadius="xl"
          bgGradient="linear(to-r, #00838F, #2B3990)"
        >
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" pl={2}>
              <FiSearch size={20} color="var(--chakra-colors-brand-teal)" />
            </InputLeftElement>
            <Input
              placeholder="Search leads by name, email, or company..."
              bg="white"
              borderRadius="xl"
              borderWidth={0}
              pl={12}
              value={searchQuery}
              onChange={handleSearch}
              _hover={{
                boxShadow: 'sm'
              }}
              _focus={{
                boxShadow: 'md',
                bg: 'white'
              }}
            />
            <InputRightElement width="5.5rem" pr={1}>
              <Button 
                h="35px" 
                w="full"
                bgGradient="linear(to-r, #00838F, #2B3990)"
                color="white"
                fontSize="sm"
                fontWeight="500"
                isLoading={isSearching}
                onClick={() => searchLeads(searchQuery)}
                _hover={{
                  bgGradient: 'linear(to-r, brand.tealHover, brand.blueHover)',
                  transform: 'translateY(-1px)',
                }}
              >
                Search
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>

        {searchQuery && results.length > 0 && (
          <Box
            position="absolute"
            top="calc(100% + 8px)"
            left={0}
            right={0}
            bg="white"
            borderRadius="lg"
            boxShadow="xl"
            border="1px"
            borderColor="gray.100"
            maxH="400px"
            overflowY="auto"
            zIndex={1000}
          >
            <VStack spacing={0} align="stretch">
              {results.map((lead) => (
                <Box
                  key={lead.id}
                  p={4}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => handleResultClick(lead)}
                  borderBottom="1px"
                  borderColor="gray.100"
                >
                  <Box display="flex" alignItems="center" gap={3}>
                    <Box
                      p={2}
                      borderRadius="full"
                      bg="brand.gradient.accent"
                    >
                      <FiUser size={20} />
                    </Box>
                    <Box flex={1}>
                      <Text fontWeight="500">
                        {lead.first_name} {lead.last_name}
                      </Text>
                      <Box display="flex" gap={4} mt={1}>
                        <Text fontSize="sm" color="gray.600" display="flex" alignItems="center" gap={1}>
                          <FiMail size={14} />
                          {lead.email}
                        </Text>
                        {lead.company_name && (
                          <Text fontSize="sm" color="gray.600" display="flex" alignItems="center" gap={1}>
                            <FiBriefcase size={14} />
                            {lead.company_name}
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default SearchBar 