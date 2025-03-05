import React, { useState } from 'react';
import { Box, Button, Text, VStack, Spinner, Badge, useToast } from '@chakra-ui/react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

// Create a browser-compatible base64 encoder for email
const createEmailRFC822 = (from, to, subject, body) => {
  // Create a proper MIME message with correct encoding
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(body)))
  ].join('\r\n');

  // URL-safe Base64 encoding
  return btoa(message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Move the token refresh function outside the component
const refreshAccessToken = async (email) => {
  try {
    const { data, error } = await supabase
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
    
    const { error: updateError } = await supabase
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
};

// Update the sendEmailToLead function to fix the variable naming conflict
export const sendEmailToLead = async (lead, emailContent) => {
  try {
    // Check if we have all required data
    if (!lead || !lead.id || !lead.email) {
      throw new Error('Missing required lead information');
    }
    
    // Get Gmail credentials
    const { data: credentials, error: credError } = await supabase
      .from('gmail_credentials')
      .select('email, access_token')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (credError) throw credError;
    
    if (!credentials || credentials.length === 0) {
      throw new Error('No Gmail account connected. Please connect your Gmail account in Admin settings.');
    }
    
    let accessToken = credentials[0].access_token;
    const senderEmail = credentials[0].email;
    
    console.log('Using Gmail API with credentials for:', senderEmail);
    
    // Always refresh token before sending
    try {
      accessToken = await refreshAccessToken(senderEmail);
      console.log('Token refreshed successfully');
    } catch (refreshError) {
      console.error('Token refresh error:', refreshError);
      throw new Error('Failed to refresh Gmail token: ' + refreshError.message);
    }
    
    // Prepare email content
    const content = emailContent || {
      subject: `Follow up from SmartLead CRM`,
      body: `Hello ${lead.first_name || 'there'},\n\nThank you for your interest in our services. I'd like to schedule a time to discuss how we can help you further.\n\nBest regards,\nYour Sales Team`
    };
    
    // Create proper MIME message format required by Gmail API
    const emailString = [
      `From: ${senderEmail}`,
      `To: ${lead.email}`,
      `Subject: ${content.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      content.body
    ].join('\r\n');
    
    // Base64 encode the email (URL-safe)
    const encodedEmail = btoa(unescape(encodeURIComponent(emailString)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('Sending email via Gmail API directly:', {
      to: lead.email,
      subject: content.subject
    });
    
    // Send via Gmail API
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      }
    );
    
    const responseText = await response.text();
    console.log('Gmail API response:', response.status, responseText);
    
    if (!response.ok) {
      let errorMessage = `Gmail API error (${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
      } catch (e) {
        errorMessage += `: ${responseText}`;
      }
      throw new Error(errorMessage);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.warn('Could not parse response as JSON:', responseText);
      data = { success: true };
    }
    
    // Record the email activity in Supabase with the correct schema
    const { error: activityError } = await supabase
      .from('activities')
      .insert([{
        lead_id: lead.id,
        activity_type: 'email_sent',
        body: `Email sent: ${content.subject}`,
      }]);
    
    if (activityError) {
      console.error('Error recording email activity:', activityError);
      console.log('Activity error details:', JSON.stringify(activityError));
    }
    
    return { 
      success: true, 
      message: 'Email sent successfully via Gmail',
      data: data
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
};

function EmailProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [lastProcessed, setLastProcessed] = useState(null);
  const toast = useToast();

  const processEmails = async () => {
    setIsProcessing(true);
    try {
      // Get the Gmail credentials
      const { data: credentials, error } = await supabase
        .from('gmail_credentials')
        .select('email, access_token, expires_at')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (!credentials || credentials.length === 0) {
        throw new Error('No Gmail account connected. Please connect your Gmail account first.');
      }
      
      let accessToken = credentials[0].access_token;
      const email = credentials[0].email;
      
      // Check if token is expired and refresh if needed
      const expiresAt = new Date(credentials[0].expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.log('Access token expired, refreshing...');
        try {
          accessToken = await refreshAccessToken(email);
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Your Gmail session has expired. Please reconnect your account.');
        }
      }
      
      // Use the backend to search and process emails
      const backendUrl = 'https://smartlead-python-six.vercel.app';
      
      try {
        const response = await axios.post(
          `${backendUrl}/leads/process_emails`,
          {
            email: email,
            access_token: accessToken,
            search_query: 'is:unread label:inbox',
            max_results: 20
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Update UI with results
        setProcessedCount(response.data?.processed_count || 0);
        setLastProcessed(new Date().toLocaleString());
        
        toast({
          title: "Emails Processed",
          description: `Processed ${response.data?.processed_count || 0} emails.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (apiError) {
        // If we get an invalid token error, try refreshing once
        if (apiError.response?.data?.detail && 
            (apiError.response.data.detail.includes('invalid_grant') || 
             apiError.response.data.detail.includes('expired'))) {
          
          console.log('Token rejected, attempting to refresh...');
          try {
            accessToken = await refreshAccessToken(email);
            
            // Try again with new token
            const retryResponse = await axios.post(
              `${backendUrl}/leads/process_emails`,
              {
                email: email,
                access_token: accessToken,
                search_query: 'is:unread label:inbox',
                max_results: 20
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            
            // Update UI with results
            setProcessedCount(retryResponse.data?.processed_count || 0);
            setLastProcessed(new Date().toLocaleString());
            
            toast({
              title: "Emails Processed",
              description: `Processed ${retryResponse.data?.processed_count || 0} emails.`,
              status: "success",
              duration: 5000,
              isClosable: true,
            });
          } catch (retryError) {
            console.error('Retry failed:', retryError);
            throw new Error('Failed to process emails even after refreshing token. Please reconnect your Gmail account.');
          }
        } else {
          // Not a token error, rethrow
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Error processing emails:', error);
      
      let errorMessage = "Failed to process emails. Please try again.";
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Email Processing Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box 
      p={6} 
      mt={4}
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor="gray.200"
    >
      <VStack align="stretch" spacing={4}>
        <Text fontWeight="medium" fontSize="lg">
          Process Emails
        </Text>
        
        <Text fontSize="sm" color="gray.600">
          Search and process emails from your connected Gmail account.
        </Text>
        
        {lastProcessed && (
          <Text fontSize="sm">
            Last processed: {lastProcessed} 
            {processedCount > 0 && (
              <Badge ml={2} colorScheme="green">{processedCount} emails</Badge>
            )}
          </Text>
        )}
        
        <Button
          onClick={processEmails}
          colorScheme="blue"
          isLoading={isProcessing}
          loadingText="Processing..."
        >
          Process Inbox Emails
        </Button>
      </VStack>
    </Box>
  );
}

export default EmailProcessor; 