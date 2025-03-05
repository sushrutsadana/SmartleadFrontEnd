import React, { useEffect, useState } from 'react';
import { Box, Button, Text, VStack, HStack, Icon, useToast } from '@chakra-ui/react';
import { FiMail, FiCheck } from 'react-icons/fi';
import axios from 'axios';
import { supabase } from '../supabaseClient';

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

  // Check if Gmail is already connected
  useEffect(() => {
    checkGmailConnection();
    
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkGmailConnection = async () => {
    try {
      // Check if we have gmail credentials stored
      const { data: credentials, error } = await supabase
        .from('gmail_credentials')
        .select('email, expires_at, refresh_token')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (credentials && credentials.length > 0) {
        // Even if token is expired, we can still set connected state
        // We'll refresh the token when needed for API calls
        setIsConnected(true);
        setUserEmail(credentials[0].email || '');
        
        // Optionally try to refresh the token in the background
        try {
          if (credentials[0].refresh_token) {
            const expiresAt = new Date(credentials[0].expires_at);
            const now = new Date();
            
            // If token is expired or will expire in the next 5 minutes, refresh it
            if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
              await refreshAccessToken(credentials[0].email, credentials[0].refresh_token);
              console.log('Token refreshed in background during connection check');
            }
          }
        } catch (refreshError) {
          console.warn('Background token refresh failed:', refreshError);
          // Don't disconnect the user yet - we'll try again when needed
        }
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };

  const connectGmail = () => {
    setIsConnecting(true);
    
    try {
      // Use a redirect URI that matches what's in your Google Cloud Console
      let redirectUri;
      
      if (window.location.hostname === 'localhost') {
        redirectUri = 'http://localhost:3000/admin';
      } else {
        // Use your production URL - based on your Google Cloud Console settings
        redirectUri = 'https://smartlead-front-end.vercel.app/admin';
      }
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      
      // Make sure to include these specific scopes for user info
      const scopes = [
        ...SCOPES,
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
        'email',
        'profile'
      ];
      
      // Generate a random state value to prevent CSRF attacks
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('gmailOAuthState', state);
      
      // Add OAuth parameters
      authUrl.searchParams.append('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');  // Always get refresh token
      authUrl.searchParams.append('state', state);
      
      // Redirect to Google OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({
        title: "Failed to connect Gmail",
        description: typeof error.message === 'string' ? error.message : "Please try again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsConnecting(false);
    }
  };

  const handleOAuthCallback = async (code) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to connect Gmail');
      }

      let redirectUri;
      
      if (window.location.hostname === 'localhost') {
        redirectUri = 'http://localhost:3000/admin';
      } else {
        redirectUri = 'https://smartlead-front-end.vercel.app/admin';
      }
      
      const backendUrl = 'https://smartlead-python-six.vercel.app';

      // Exchange code for token
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code: code,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }
      );
      
      if (!tokenResponse.data || !tokenResponse.data.access_token) {
        throw new Error('Invalid token response from Google');
      }
      
      const accessToken = tokenResponse.data.access_token;
      console.log('Got access token, length:', accessToken.length);
      
      // Get user info - explicitly build the authorization header
      const userInfoResponse = await axios({
        method: 'GET',
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      });
      
      if (!userInfoResponse.data || !userInfoResponse.data.email) {
        throw new Error('Failed to get user info from Google');
      }
      
      const userEmail = userInfoResponse.data.email;
      console.log('Got user email:', userEmail);
      
      // Before inserting into Supabase
      const { data: existingCredentials } = await supabase
        .from('gmail_credentials')
        .select('id')
        .eq('email', userEmail)
        .limit(1);

      if (existingCredentials && existingCredentials.length > 0) {
        // Update existing record instead of inserting
        const { error } = await supabase
          .from('gmail_credentials')
          .update({
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
          })
          .eq('email', userEmail);
          
        if (error) {
          console.error('Supabase update error:', error);
          throw new Error(`Failed to update credentials: ${error.message}`);
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('gmail_credentials')
          .insert({
            email: userEmail,
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
          });
          
        if (error) {
          console.error('Supabase insert error:', error);
          throw new Error(`Failed to save credentials: ${error.message}`);
        }
      }
      
      setIsConnected(true);
      setUserEmail(userEmail);
      
      toast({
        title: "Gmail connected",
        description: `Connected to ${userEmail}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Optional: Still notify your backend that OAuth succeeded
      try {
        await axios.post(
          `${backendUrl}/settings/gmail-connected`,
          { email: userEmail },
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (backendError) {
        console.warn('Failed to notify backend of successful connection:', backendError);
        // Continue anyway, this is optional
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      
      let errorMessage = "Failed to connect Gmail. Please try again.";
      if (typeof error.message === 'string') {
        errorMessage = error.message;
      }
      
      toast({
        title: "Gmail Connection Failed",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      // Explicitly use the backend URL
      const backendUrl = 'https://smartlead-python-six.vercel.app';
      
      // Call the disconnect endpoint
      await axios.post(`${backendUrl}/settings/gmail-disconnect`);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('gmail_credentials')
        .delete()
        .eq('email', userEmail);
      
      if (error) throw error;
      
      // Update state
      setIsConnected(false);
      setUserEmail('');
      
      toast({
        title: "Gmail disconnected",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      
      // Ensure error message is a string
      const errorMessage = typeof error.message === 'string' 
        ? error.message 
        : "Please try again";
      
      toast({
        title: "Failed to disconnect Gmail",
        description: errorMessage,
        status: "error",
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