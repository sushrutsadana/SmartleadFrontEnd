import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Badge,
  List,
  ListItem,
  Icon,
  useToast,
  Spinner,
  Center,
  Box,
  Container,
  Heading,
} from '@chakra-ui/react'
import { FiMail, FiUser, FiArrowRight, FiUsers, FiRefreshCw, FiBriefcase, FiClock, FiTrash2 } from 'react-icons/fi'
import { createClient } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import axios from 'axios'
import EmailProcessor, { scheduleAutoReply } from '../components/EmailProcessor'
import { supabase } from '../supabaseClient'
import PendingAutoreplies from '../components/PendingAutoreplies'

const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

function CheckEmails() {
  const [emails, setEmails] = useState([])
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [autoProcess, setAutoProcess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchEmails()
    const savedAutoProcess = localStorage.getItem('autoProcessEmails')
    if (savedAutoProcess) {
      setAutoProcess(JSON.parse(savedAutoProcess))
    }
  }, [])

  const refreshAccessToken = async (email) => {
    try {
      const { data, error } = await supabaseClient
        .from('gmail_credentials')
        .select('refresh_token')
        .eq('email', email)
        .single()
      
      if (error) throw error
      if (!data || !data.refresh_token) {
        throw new Error('No refresh token found. Please reconnect your Gmail account.')
      }
      
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: data.refresh_token,
          grant_type: 'refresh_token'
        }
      )
      
      if (!tokenResponse.data || !tokenResponse.data.access_token) {
        throw new Error('Failed to refresh access token')
      }
      
      const { error: updateError } = await supabaseClient
        .from('gmail_credentials')
        .update({
          access_token: tokenResponse.data.access_token,
          expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
        })
        .eq('email', email)
      
      if (updateError) throw updateError
      
      return tokenResponse.data.access_token
    } catch (error) {
      console.error('Failed to refresh token:', error)
      throw error
    }
  }

  const fetchEmails = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 1. Check if Gmail is connected
      const { data: credentials, error: credError } = await supabase
        .from('gmail_credentials')
        .select('*')
        .limit(1);
      
      if (credError) throw credError;
      
      if (!credentials || credentials.length === 0) {
        throw new Error('No Gmail account connected. Please connect Gmail in Admin settings.');
      }
      
      console.log('Gmail credentials found:', credentials[0].email);
      
      // 2. Fetch emails from backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/emails?limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching emails: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Emails fetched:', data);
      setEmails(data.emails || []);
      
    } catch (err) {
      console.error('Error fetching emails:', err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const processEmails = async () => {
    setIsProcessing(true)
    
    try {
      // Get the most recent Gmail credentials
      const { data: credentials, error } = await supabaseClient
        .from('gmail_credentials')
        .select('email, access_token, expires_at, refresh_token')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) throw error
      
      if (!credentials || credentials.length === 0) {
        throw new Error('No Gmail account connected. Please connect your Gmail account in Admin settings.')
      }
      
      let accessToken = credentials[0].access_token
      const email = credentials[0].email
      
      // Always refresh the token first
      try {
        accessToken = await refreshAccessToken(email)
        console.log('Token refreshed successfully')
      } catch (refreshError) {
        throw new Error('Failed to refresh Gmail token. Please reconnect your account.')
      }

      // Use the Gmail API directly to fetch emails
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=in:inbox -category:promotions -category:social -label:spam newer_than:1d`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.messages || data.messages.length === 0) {
        toast({
          title: 'No new emails',
          description: 'No unread emails found in your inbox',
          status: 'info',
          duration: 5000,
          isClosable: true,
        })
        setIsProcessing(false)
        return
      }

      // Fetch each email's full details
      const emailPromises = data.messages.slice(0, 5).map(async (message) => {
        const msgResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (!msgResponse.ok) {
          console.error(`Error fetching message ${message.id}: ${msgResponse.status}`)
          return null
        }
        
        return await msgResponse.json()
      })
      
      const emailsData = await Promise.all(emailPromises)
      const validEmails = emailsData.filter(email => email !== null)
      
      // Process these emails and display them
      const processedEmails = validEmails.map(email => {
        // Extract email fields
        const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject'
        const from = email.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender'
        const date = email.payload.headers.find(h => h.name === 'Date')?.value
        
        // Extract body - handle different MIME types
        let body = ''
        if (email.payload.parts && email.payload.parts.length) {
          // Find text part
          const textPart = email.payload.parts.find(part => 
            part.mimeType === 'text/plain' || part.mimeType === 'text/html'
          )
          
          if (textPart && textPart.body.data) {
            // Base64 decode the body
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
            if (textPart.mimeType === 'text/html') {
              // Strip HTML tags for display
              body = body.replace(/<[^>]*>/g, ' ')
            }
          }
        } else if (email.payload.body && email.payload.body.data) {
          body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'))
        }
        
        return {
          id: email.id,
          threadId: email.threadId,
          subject,
          from,
          body: body.substring(0, 500) + (body.length > 500 ? '...' : ''),
          received_at: date || new Date(parseInt(email.internalDate)).toISOString(),
          labelIds: email.labelIds || []
        }
      })
      
      // Display the fetched emails
      setEmails(processedEmails)
      
      // Now create leads from the emails
      try {
        // Create leads from emails
        const createdLeads = []
        const skippedEmails = []
        
        for (const email of processedEmails) {
          try {
            // Extract email address from sender
            let senderEmail = '';
            const emailMatch = email.from.match(/<([^>]+)>/);
            if (emailMatch && emailMatch[1]) {
              senderEmail = emailMatch[1];
            } else if (email.from.includes('@')) {
              senderEmail = email.from.trim();
            }
            
            // Skip if no valid email found
            if (!senderEmail) {
              console.log('Skipping email with no sender address');
              skippedEmails.push({subject: email.subject, reason: 'No sender email'});
              continue;
            }
            
            // Check if lead with this email already exists
            const { data: existingLeads, error: checkError } = await supabaseClient
              .from('leads')
              .select('id, email')
              .eq('email', senderEmail)
              .limit(1);
            
            if (checkError) {
              console.error('Error checking for existing lead:', checkError);
            } else if (existingLeads && existingLeads.length > 0) {
              console.log(`Lead already exists for email ${senderEmail}, skipping`);
              skippedEmails.push({subject: email.subject, email: senderEmail, reason: 'Lead already exists'});
              continue;
            }
            
            // Extract name and email with better handling for notification emails
            let senderName = 'Unknown';
            let leadSource = 'email';
            let leadName = '';
            
            // Check for Facebook notifications
            if (email.from.includes('facebook') || email.from.includes('fb.com')) {
              senderName = 'Facebook';
              leadSource = 'facebook';
              // Extract the actual name from the subject if possible
              if (email.subject.includes('Did you just add this')) {
                leadName = 'Facebook User';
              } else if (email.subject.includes('Welcome to Facebook')) {
                leadName = 'Facebook Developer';
              } else {
                // Try to extract a name from the subject
                const words = email.subject.split(' ');
                if (words.length > 2) {
                  leadName = words[0] + ' ' + words[1];
                } else {
                  leadName = 'Facebook User';
                }
              }
            } else {
              // Regular email handling
              const fromMatch = email.from.match(/^"?([^"<]+)"?\s*(?:<.+>)?$/);
              if (fromMatch && fromMatch[1]) {
                senderName = fromMatch[1].trim();
              }
            }
            
            // Create lead with better fields and without the notes field
            const lead = {
              lead_source: leadSource,
              created_at: new Date().toISOString(),
              first_name: leadName || senderName.split(' ')[0] || 'Unknown',
              last_name: senderName.split(' ').length > 1 ? 
                senderName.split(' ').slice(1).join(' ') : '',
              email: senderEmail,
              status: 'new'
            };
            
            console.log('Creating lead:', lead);
            
            // Check which fields exist in the table
            if (leadsExample && leadsExample.length > 0) {
              const example = leadsExample[0];
              
              // Add standard fields if they exist
              if ('email' in example) lead.email = senderEmail;
              if ('first_name' in example) lead.first_name = senderName.split(' ')[0] || 'Unknown';
              if ('last_name' in example) {
                const nameParts = senderName.split(' ');
                lead.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              }
              if ('status' in example) lead.status = 'new';
            }
            
            // Insert lead
            const { data: newLead, error: insertError } = await supabaseClient
              .from('leads')
              .insert([lead])
              .select();
              
            if (insertError) {
              console.error('Error inserting lead:', insertError);
              toast({
                title: 'Lead Creation Error',
                description: `Could not create lead from ${email.from}: ${insertError.message}`,
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            } else if (newLead) {
              createdLeads.push(newLead[0]);
              console.log('Lead created successfully:', newLead[0]);
            }
          } catch (singleLeadError) {
            console.error('Error processing single email to lead:', singleLeadError);
            skippedEmails.push({subject: email.subject, reason: 'Processing error'});
            // Continue to next email even if this one fails
          }
        }
        
        // After leads creation, update how we fetch leads data
        await fetchEmails();
        
        // Also add this to explicitly refresh the leads after processing
        const { data: newLeadsData, error: newLeadsError } = await supabaseClient
          .from('leads')
          .select('*')
          .eq('lead_source', 'email')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (!newLeadsError && newLeadsData) {
          setLeads(newLeadsData);
        }
        
        toast({
          title: 'Email Processing Complete',
          description: `Created ${createdLeads.length} new leads. Skipped ${skippedEmails.length} emails (already processed or invalid).`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      } catch (leadError) {
        console.error('Error creating leads:', leadError)
        toast({
          title: 'Partial Success',
          description: `Emails fetched but lead creation failed: ${leadError.message}`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Email processing error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to process emails',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAutoProcessToggle = (e) => {
    const newValue = e.target.checked
    setAutoProcess(newValue)
    localStorage.setItem('autoProcessEmails', JSON.stringify(newValue))
    
    toast({
      title: newValue ? 'Auto-process enabled' : 'Auto-process disabled',
      description: newValue 
        ? 'Emails will be processed automatically every day' 
        : 'Automatic email processing has been turned off',
      status: 'info',
      duration: 5000,
      isClosable: true,
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      contacted: 'yellow',
      qualified: 'green',
      lost: 'red',
      won: 'purple'
    }
    return colors[status] || 'gray'
  }

  const handleLeadClick = (lead) => {
    navigate(`/lead/${lead.id}`)
  }

  const createLeadFromEmail = async (email) => {
    try {
      // Extract name and email
      let senderName = 'Unknown';
      let senderEmail = '';
      
      const fromMatch = email.from.match(/^"?([^"<]+)"?\s*(?:<.+>)?$/);
      if (fromMatch && fromMatch[1]) {
        senderName = fromMatch[1].trim();
      }
      
      const emailMatch = email.from.match(/<([^>]+)>/);
      if (emailMatch && emailMatch[1]) {
        senderEmail = emailMatch[1];
      } else if (email.from.includes('@')) {
        senderEmail = email.from.trim();
      }
      
      // Check if lead exists
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id, email')
        .eq('email', senderEmail)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // Not found error code
        console.error('Error checking for existing lead:', checkError);
        throw checkError;
      }

      let leadId;
      
      if (existingLead) {
        leadId = existingLead.id;
        toast({
          title: 'Lead Already Exists',
          description: `Recording email activity for ${senderEmail}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new lead
        const lead = {
          lead_source: 'email',
          created_at: new Date().toISOString(),
          first_name: senderName.split(' ')[0] || 'Unknown',
          last_name: senderName.split(' ').length > 1 ? 
            senderName.split(' ').slice(1).join(' ') : '',
          email: senderEmail,
          status: 'new'
        };
        
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert([lead])
          .select();
        
        if (insertError) throw insertError;
        leadId = newLead[0].id;
      }

      // Create activity record in either case
      await supabase
        .from('activities')
        .insert([{
          lead_id: leadId,
          activity_type: 'email_received',
          activity_datetime: email.received_at || new Date().toISOString(),
          body: `Email received: ${email.subject}\n\n${email.body.substring(0, 500)}...`
        }]);
      
      // Refresh leads list
      await fetchEmails();
      
      if (!existingLead) {
        toast({
          title: 'Lead Created',
          description: `Created lead from: ${senderName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // Schedule auto-reply
      await scheduleAutoReply(email);
      
      // Display toast notification
      toast({
        title: 'Auto-reply scheduled',
        description: 'An auto-reply will be sent in 5 minutes',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error processing email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add this new function for deleting leads
  const handleDeleteLead = async (leadId, e) => {
    // Stop propagation to prevent navigation when clicking delete
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        const { error } = await supabaseClient
          .from('leads')
          .delete()
          .eq('id', leadId);
        
        if (error) throw error;
        
        // Update the leads list by filtering out the deleted lead
        setLeads(leads.filter(lead => lead.id !== leadId));
        
        toast({
          title: 'Lead Deleted',
          description: 'The lead has been successfully deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete lead: ' + error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEmailsProcessed = async (emails) => {
    let newLeadsCount = 0;
    
    for (const email of emails) {
      try {
        // Extract sender info
        const from = email.from;
        const matches = from.match(/<(.+?)>/) || [null, from];
        const emailAddress = matches[1];
        const name = from.replace(/<.*?>/, '').trim();
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');

        // Check if lead exists
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', emailAddress)
          .single();

        if (!existingLead) {
          // Create new lead
          const { data: newLead, error: leadError } = await supabase
            .from('leads')
            .insert([{
              first_name: firstName,
              last_name: lastName,
              email: emailAddress,
              status: 'new',
              lead_source: 'email',
              created_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (leadError) throw leadError;

          // Create activity
          await supabase
            .from('activities')
            .insert([{
              lead_id: newLead.id,
              activity_type: 'email_received',
              activity_datetime: email.date || new Date().toISOString(),
              body: `Email received: ${email.subject}\n\n${email.body.substring(0, 500)}...`
            }]);

          newLeadsCount++;
        }
      } catch (error) {
        console.error('Error creating lead from email:', error);
      }
    }

    // Update UI
    fetchEmails(); // Refresh the emails list
    
    toast({
      title: 'Emails Processed',
      description: `Created ${newLeadsCount} new leads`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Add this function to check if a lead exists
  const checkIfLeadExists = async (email) => {
    const emailMatch = email.from.match(/<([^>]+)>/) || [null, email.from];
    const emailAddress = emailMatch[1];
    
    const { data } = await supabase
      .from('leads')
      .select('id')
      .eq('email', emailAddress)
      .single();
      
    return !!data;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Center h="200px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading emails...</Text>
          </VStack>
        </Center>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Check Emails"
        description="Check and process new email leads"
      />

      <VStack spacing={6} align="stretch">
        <EmailProcessor onProcessComplete={processEmails} />
        <PendingAutoreplies />

        <Card>
          <Box p={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Received Emails</Heading>
              <Text color="gray.500" fontSize="sm">
                {emails.length} emails found
              </Text>
            </HStack>

            {isLoading ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : emails.length === 0 ? (
              <Box 
                py={8} 
                textAlign="center" 
                bg="gray.50" 
                borderRadius="md"
              >
                <Icon as={FiMail} boxSize={8} color="gray.400" mb={3} />
                <Text color="gray.600">No new emails to process</Text>
              </Box>
            ) : (
              <List spacing={4}>
                {emails.map((email) => (
                  <ListItem
                    key={email.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiMail} color="blue.500" />
                          <Text fontWeight="medium">
                            {email.subject}
                          </Text>
                        </HStack>
                        
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          leftIcon={<Icon as={FiUser} />}
                          onClick={() => createLeadFromEmail(email)}
                          isLoading={isProcessing}
                        >
                          Create Lead
                        </Button>
                      </HStack>

                      <HStack spacing={4} color="gray.600" fontSize="sm">
                        <Text>From: {email.from}</Text>
                        <Text>•</Text>
                        <Text>{new Date(email.received_at).toLocaleString()}</Text>
                      </HStack>

                      <Text 
                        fontSize="sm" 
                        color="gray.700" 
                        noOfLines={3}
                        whiteSpace="pre-wrap"
                      >
                        {email.body}
                      </Text>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Card>

        <Card>
          <VStack align="stretch" spacing={4}>
            <Text fontWeight="bold" fontSize="lg">Generated Leads</Text>
            
            {isLoading ? (
              <Box py={8} textAlign="center">
                <Spinner size="lg" color="blue.500" />
              </Box>
            ) : leads.length === 0 ? (
              <Box 
                py={8} 
                textAlign="center" 
                borderRadius="lg" 
                bg="gray.50"
              >
                <Icon as={FiMail} boxSize={8} color="gray.400" mb={3} />
                <Text color="gray.600">No email leads to process</Text>
              </Box>
            ) : (
              <List spacing={3}>
                {leads.map((lead) => (
                  <ListItem
                    key={lead.id}
                    onClick={() => handleLeadClick(lead)}
                    cursor="pointer"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    _hover={{ 
                      bg: 'gray.50',
                      borderColor: 'blue.200',
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm'
                    }}
                    transition="all 0.2s"
                    role="group"
                    position="relative"
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Box
                            p={2}
                            borderRadius="full"
                            bg="blue.50"
                          >
                            <FiUser size={14} color="var(--chakra-colors-blue-500)" />
                          </Box>
                          <Text 
                            fontWeight="medium"
                            _groupHover={{ color: 'blue.500' }}
                          >
                            {lead.first_name} {lead.last_name}
                          </Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                          <Button 
                            size="xs" 
                            colorScheme="red" 
                            leftIcon={<Icon as={FiTrash2} />}
                            onClick={(e) => handleDeleteLead(lead.id, e)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </HStack>

                      {lead.company_name && (
                        <HStack fontSize="sm" color="gray.600" spacing={2} ml="44px">
                          <FiBriefcase size={12} />
                          <Text>{lead.company_name}</Text>
                        </HStack>
                      )}

                      <HStack fontSize="xs" color="gray.500" spacing={2} ml="44px">
                        <FiClock size={12} />
                        <Text>
                          Added {new Date(lead.created_at).toLocaleDateString()}
                        </Text>
                        {lead.email && (
                          <>
                            <Text>•</Text>
                            <FiMail size={12} />
                            <Text>{lead.email}</Text>
                          </>
                        )}
                      </HStack>
                    </VStack>
                  </ListItem>
                ))}
              </List>
            )}
          </VStack>
        </Card>
      </VStack>
    </PageContainer>
  )
}

export default CheckEmails 