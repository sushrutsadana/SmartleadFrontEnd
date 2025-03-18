import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, HStack, Icon, useToast } from '@chakra-ui/react';
import { FiMail, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

// Gmail API scopes we need
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify'
];

function GmailConnector() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if Gmail is already connected
  useEffect(() => {
    checkGmailConnection();
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    if (code) {
      console.log('Received OAuth code:', code.substring(0, 10) + '...'); // Debug log but don't show full code
      handleOAuthCallback(code);
    }
  }, [location]); // Add location as dependency

  const checkGmailConnection = async () => {
    try {
      const { data: credentials, error } = await supabase
        .from('gmail_credentials')
        .select('email')
        .single();
      
      if (error) {
        console.log('No Gmail connection found');
        return;
      }
      
      setIsConnected(true);
      setUserEmail(credentials.email);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };

  const connectGmail = async () => {
    setIsConnecting(true);
    
    try {
      const SCOPES = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ');

      const redirectUri = window.location.origin + '/admin/gmail-callback';
      console.log('Initiating with redirect URI:', redirectUri);

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');
      authUrl.searchParams.append('scope', SCOPES);
      authUrl.searchParams.append('state', location.pathname);

      console.log('Auth URL:', authUrl.toString());
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error initiating Gmail connection:', error);
      setIsConnecting(false);
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to initiate Gmail connection',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOAuthCallback = async (code) => {
    try {
      const redirectUri = window.location.origin + '/admin/gmail-callback';
      console.log('Using redirect URI:', redirectUri);

      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }
      );

      console.log('Token response received'); // Debug log

      if (!tokenResponse.data?.access_token) {
        throw new Error('Invalid token response from Google');
      }

      // Get user info
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`
          }
        }
      );

      if (!userInfoResponse.data?.email) {
        throw new Error('Failed to get user info from Google');
      }

      // Store in Supabase
      const { error: supabaseError } = await supabase
        .from('gmail_credentials')
        .upsert({
          email: userInfoResponse.data.email,
          access_token: tokenResponse.data.access_token,
          refresh_token: tokenResponse.data.refresh_token,
          expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
        });

      if (supabaseError) throw supabaseError;

      setIsConnected(true);
      setUserEmail(userInfoResponse.data.email);

      toast({
        title: 'Gmail Connected',
        description: 'Successfully connected your Gmail account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Use navigate instead of window.location
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('Full error:', error);
      console.error('Response data:', error.response?.data);
      toast({
        title: 'Connection Failed',
        description: error.response?.data?.error_description || error.message || 'Failed to complete Gmail connection',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin', { replace: true });
    }
  };

  const disconnectGmail = async () => {
    try {
      // Make request to backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/settings/gmail-disconnect`,
        { email: userEmail }
      );

      if (response.data.success) {
        setIsConnected(false);
        setUserEmail('');
        
        toast({
          title: 'Gmail Disconnected',
          description: 'Your Gmail account has been disconnected successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: 'Disconnection Failed',
        description: error.response?.data?.detail || 'Failed to disconnect Gmail account',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add this utility function for refreshing tokens
  const refreshAccessToken = async (email, refreshToken) => {
    try {
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        }
      );
      
      if (!tokenResponse.data || !tokenResponse.data.access_token) {
        throw new Error('Failed to refresh access token');
      }
      
      // Update the token in Supabase
      const { error: updateError } = await supabase
        .from('gmail_credentials')
        .update({
          access_token: tokenResponse.data.access_token,
          expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
        })
        .eq('email', email);
      
      if (updateError) throw updateError;
      
      return tokenResponse.data.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  };

  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={isConnected ? "green.200" : "gray.200"}
      bg={isConnected ? "green.50" : "white"}
    >
      <VStack align="stretch" spacing={4}>
        <HStack>
          <Icon 
            as={isConnected ? FiCheck : FiMail} 
            color={isConnected ? "green.500" : "gray.500"} 
            boxSize={6} 
          />
          <Text fontWeight="medium" fontSize="lg">
            {isConnected ? "Gmail Connected" : "Connect Gmail Account"}
          </Text>
        </HStack>
        
        {isConnected ? (
          <VStack align="start" spacing={3}>
            <Text>Connected to: <strong>{userEmail}</strong></Text>
            <Text fontSize="sm" color="gray.600">
              Your Gmail account is connected. SmartLead CRM can now process emails from your inbox.
            </Text>
            <Button 
              onClick={disconnectGmail} 
              colorScheme="red" 
              variant="outline" 
              size="sm"
            >
              Disconnect Gmail
            </Button>
          </VStack>
        ) : (
          <VStack align="start" spacing={3}>
            <Text fontSize="sm" color="gray.600">
              Connect your Gmail account to automatically process incoming leads from your email.
            </Text>
            <Button
              leftIcon={<FiMail />}
              onClick={connectGmail}
              colorScheme="blue"
              isLoading={isConnecting}
              loadingText="Connecting..."
            >
              Connect Gmail Account
            </Button>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}

export default GmailConnector; 