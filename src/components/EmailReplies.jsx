import React, { useState, useEffect } from 'react';
import { Box, Heading, List, ListItem, Text, Tag, Button, HStack, VStack, useToast } from '@chakra-ui/react';
import { supabase } from '../supabaseClient';
import { sendEmailToLead } from './EmailProcessor';

function EmailReplies() {
  const [pendingReplies, setPendingReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchPendingReplies();
    const interval = setInterval(fetchPendingReplies, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPendingReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_autoreplies')
        .select(`
          id, 
          lead_id, 
          subject, 
          from_email, 
          response_text, 
          scheduled_time, 
          sent, 
          sent_at,
          leads(first_name, last_name, email)
        `)
        .eq('sent', false)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setPendingReplies(data || []);
      
      // Check for autoreplies that need to be sent
      const now = new Date();
      const readyToSend = data.filter(reply => 
        new Date(reply.scheduled_time) <= now && !reply.sent
      );
      
      if (readyToSend.length > 0) {
        await sendPendingReplies(readyToSend);
      }
    } catch (error) {
      console.error('Error fetching pending auto-replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPendingReplies = async (repliesToSend) => {
    for (const reply of repliesToSend) {
      try {
        // Get lead information if available
        let emailReceiver;
        if (reply.leads) {
          emailReceiver = {
            id: reply.lead_id,
            email: reply.leads.email,
            first_name: reply.leads.first_name,
            last_name: reply.leads.last_name
          };
        } else {
          emailReceiver = {
            id: null,
            email: reply.from_email,
            first_name: '',
            last_name: ''
          };
        }

        // Send the email
        const result = await sendEmailToLead(emailReceiver, {
          subject: reply.subject,
          body: reply.response_text
        });

        if (result.success) {
          // Update the auto-reply as sent
          await supabase
            .from('pending_autoreplies')
            .update({
              sent: true,
              sent_at: new Date().toISOString()
            })
            .eq('id', reply.id);
            
          toast({
            title: 'Auto-reply sent',
            description: `Auto-reply sent to ${emailReceiver.email}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(`Error sending auto-reply ${reply.id}:`, error);
        toast({
          title: 'Failed to send auto-reply',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
    // Refresh the list after sending
    fetchPendingReplies();
  };

  const formatTimeLeft = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMs = scheduled - now;
    
    if (diffMs <= 0) return 'Sending now...';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    return diffMins > 0 
      ? `${diffMins}m ${diffSecs}s` 
      : `${diffSecs}s`;
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Pending Auto-Replies</Heading>
        <Button size="sm" colorScheme="blue" onClick={fetchPendingReplies} isLoading={isLoading}>
          Refresh
        </Button>
      </HStack>
      
      {pendingReplies.length === 0 ? (
        <Text color="gray.500">No pending auto-replies</Text>
      ) : (
        <List spacing={3}>
          {pendingReplies.map(reply => (
            <ListItem key={reply.id} p={3} borderWidth="1px" borderRadius="md">
              <VStack align="start" spacing={2}>
                <HStack justify="space-between" width="100%">
                  <Text fontWeight="bold">{reply.subject}</Text>
                  <Tag colorScheme="orange">
                    {formatTimeLeft(reply.scheduled_time)}
                  </Tag>
                </HStack>
                <Text fontSize="sm">
                  To: {reply.from_email}
                </Text>
                <Text fontSize="sm" noOfLines={2}>
                  {reply.response_text}
                </Text>
              </VStack>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default EmailReplies;