import { useState, useEffect } from 'react'
import {
  Box, VStack, Text, Button, Textarea, useToast,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  HStack, Icon, SimpleGrid, Badge, Divider, useClipboard, Heading
} from '@chakra-ui/react'
import { FiMail, FiEdit2, FiCopy, FiCheckCircle, FiMessageSquare, FiPhone } from 'react-icons/fi'
import { SiGmail } from 'react-icons/si'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { getPrompt, savePrompt, resetPrompt, DEFAULT_PROMPTS_LIST } from '../utils/prompts'
import GmailConnector from '../components/GmailConnector'

function Admin() {
  const [prompts, setPrompts] = useState({
    call: '',
    whatsapp: '',
    email: ''
  })
  const toast = useToast()
  const { hasCopied, onCopy } = useClipboard('smartleadplatform@gmail.com')
  const { hasCopied: hasWhatsAppCopied, onCopy: onWhatsAppCopy } = useClipboard('+1 415 523 8886')
  const { hasCopied: hasJoinCodeCopied, onCopy: onJoinCodeCopy } = useClipboard('join balloon-differ')

  useEffect(() => {
    // Load current prompts (including any customizations)
    setPrompts({
      call: getPrompt('call'),
      whatsapp: getPrompt('whatsapp'),
      email: getPrompt('email')
    })
  }, [])

  useEffect(() => {
    // Check Gmail Connection on admin page load
    const checkConnections = async () => {
      // Add code to check Gmail connection status
      // You can call a function similar to checkGmailConnection here
    };
    
    checkConnections();
  }, []);

  const handleSave = (type) => {
    savePrompt(type, prompts[type])
    toast({
      title: 'Prompt Updated',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} prompt has been updated`,
      status: 'success',
      duration: 3000,
    })
  }

  const handleReset = (type) => {
    resetPrompt(type)
    setPrompts(prev => ({
      ...prev,
      [type]: DEFAULT_PROMPTS_LIST[type]
    }))
    toast({
      title: 'Prompt Reset',
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} prompt has been reset to default`,
      status: 'info',
      duration: 3000,
    })
  }

  const promptIcons = {
    call: FiPhone,
    whatsapp: FiMessageSquare,
    email: FiMail
  }

  return (
    <PageContainer>
      <PageHeader
        title="Admin Settings"
        description="Manage system prompts and configurations"
      />

      <SimpleGrid columns={1} spacing={6} px={6}>
        {/* WhatsApp Configuration Card */}
        <Card>
          <VStack spacing={6} align="stretch" p={6}>
            <HStack spacing={4}>
              <Icon as={FiMessageSquare} boxSize={6} color="green.500" />
              <Text fontSize="xl" fontWeight="bold">
                WhatsApp Configuration
              </Text>
            </HStack>
            
            <Box bg="gray.50" p={4} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium">Connected WhatsApp Service:</Text>
                <HStack>
                  <Text color="gray.600">Twilio Sandbox</Text>
                  <Badge colorScheme="green">Connected</Badge>
                </HStack>
                <Divider my={2} />
                <Text fontWeight="medium" size="sm">Sandbox Number:</Text>
                <HStack>
                  <Text color="gray.600">+1 415 523 8886</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={hasWhatsAppCopied ? <FiCheckCircle /> : <FiCopy />}
                    onClick={onWhatsAppCopy}
                  >
                    {hasWhatsAppCopied ? "Copied!" : "Copy"}
                  </Button>
                </HStack>
                <Text fontWeight="medium" size="sm">Join Code:</Text>
                <HStack>
                  <Text color="gray.600">join balloon-differ</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={hasJoinCodeCopied ? <FiCheckCircle /> : <FiCopy />}
                    onClick={onJoinCodeCopy}
                  >
                    {hasJoinCodeCopied ? "Copied!" : "Copy"}
                  </Button>
                </HStack>
              </VStack>
            </Box>

            <Box bg="blue.50" p={4} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium" color="blue.800">
                  Need to change WhatsApp configuration?
                </Text>
                <Text color="blue.600">
                  Contact the administrator to upgrade to a production WhatsApp Business account or modify settings.
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => window.location.href = 'mailto:smartleadplatform@gmail.com'}
                >
                  Contact Admin
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Card>

        {/* Email Configuration Card */}
        <Card>
          <VStack spacing={6} align="stretch" p={6}>
            <HStack spacing={4}>
              <Icon as={SiGmail} boxSize={6} color="red.500" />
              <Text fontSize="xl" fontWeight="bold">
                Email Configuration
              </Text>
            </HStack>
            
            <Box bg="gray.50" p={4} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium">Connected Email Account:</Text>
                <HStack>
                  <Text color="gray.600">smartleadplatform@gmail.com</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={hasCopied ? <FiCheckCircle /> : <FiCopy />}
                    onClick={onCopy}
                  >
                    {hasCopied ? "Copied!" : "Copy"}
                  </Button>
                </HStack>
                <Badge colorScheme="green">Connected</Badge>
              </VStack>
            </Box>

            <Box bg="blue.50" p={4} borderRadius="md">
              <VStack align="start" spacing={2}>
                <Text fontWeight="medium" color="blue.800">
                  Need to change email configuration?
                </Text>
                <Text color="blue.600">
                  Contact the administrator to modify email settings or connect a different account.
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => window.location.href = 'mailto:smartleadplatform@gmail.com'}
                >
                  Contact Admin
                </Button>
              </VStack>
            </Box>
          </VStack>
        </Card>

        {/* System Prompts Card */}
        <Card>
          <VStack spacing={6} align="stretch" p={6}>
            <HStack spacing={4}>
              <Icon as={FiEdit2} boxSize={6} color="blue.500" />
              <Text fontSize="xl" fontWeight="bold">
                System Prompts
              </Text>
            </HStack>

            <Text color="gray.600">
              Customize AI generation prompts for different communication channels
            </Text>

            <Divider />

            <Accordion allowMultiple>
              {Object.entries(prompts).map(([type, prompt]) => (
                <AccordionItem key={type} border="none" mb={4}>
                  <AccordionButton 
                    bg="gray.50" 
                    _hover={{ bg: 'gray.100' }}
                    borderRadius="md"
                  >
                    <HStack flex="1" spacing={4}>
                      <Icon as={promptIcons[type]} color="blue.500" />
                      <Text fontWeight="medium">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Prompt
                      </Text>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack align="stretch" spacing={4}>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompts(prev => ({
                          ...prev,
                          [type]: e.target.value
                        }))}
                        rows={10}
                        fontFamily="mono"
                        placeholder={`Enter ${type} system prompt...`}
                      />
                      <HStack justify="flex-end" spacing={4}>
                        <Button
                          variant="outline"
                          onClick={() => handleReset(type)}
                        >
                          Reset to Default
                        </Button>
                        <Button
                          colorScheme="blue"
                          onClick={() => handleSave(type)}
                        >
                          Save Changes
                        </Button>
                      </HStack>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </VStack>
        </Card>

        <Card>
          <Box p={6}>
            <Heading size="md" mb={4}>Email Integration</Heading>
            <Text mb={6}>
              Connect your email accounts to automatically process incoming leads and send emails directly from the CRM.
            </Text>
            
            <GmailConnector />
          </Box>
        </Card>
      </SimpleGrid>
    </PageContainer>
  )
}

export default Admin 