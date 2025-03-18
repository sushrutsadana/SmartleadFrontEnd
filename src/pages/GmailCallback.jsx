import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

function GmailCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Restore auth state if needed
        const savedToken = sessionStorage.getItem('supabaseToken');
        if (savedToken) {
          await supabase.auth.setSession({
            access_token: savedToken,
            refresh_token: savedToken
          });
        }

        // Get the OAuth code and state
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const returnPath = urlParams.get('state') || '/admin';

        if (code) {
          // Exchange code for tokens
          const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            redirect_uri: `${window.location.origin}/admin/gmail-callback`,
            grant_type: 'authorization_code'
          });

          // Get user info
          const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
          });

          // Store credentials in Supabase
          await supabase.from('gmail_credentials').upsert({
            email: userResponse.data.email,
            access_token: tokenResponse.data.access_token,
            refresh_token: tokenResponse.data.refresh_token,
            expires_at: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString()
          });
        }

        // Clean up
        sessionStorage.removeItem('supabaseToken');
        sessionStorage.removeItem('gmailReturnPath');

        // Return to the original page
        navigate(returnPath);
      } catch (error) {
        console.error('Error in Gmail callback:', error);
        navigate('/admin', { 
          state: { 
            error: 'Failed to connect Gmail account. Please try again.' 
          }
        });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text>Connecting your Gmail account...</Text>
      </VStack>
    </Box>
  );
}

export default GmailCallback; 