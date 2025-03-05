import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { router } from './routes'
import theme from './theme'
import { sendEmailToLead } from './components/EmailProcessor'

// Add fetch interceptor for email API calls
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
  // Check if this is a send-email API call
  if (typeof url === 'string' && 
      url.includes('/leads/') && 
      url.includes('/send-email') &&
      options?.method === 'POST') {
    
    console.log('Intercepting email API call:', url);
    
    try {
      // Parse the request data
      const requestData = JSON.parse(options.body);
      
      // Extract lead ID from the URL
      const leadId = url.split('/leads/')[1].split('/')[0];
      
      // Create a lead object with the data we have
      const lead = { 
        id: leadId,
        email: requestData.to || requestData.email,
        first_name: requestData.first_name || 'Lead'
      };
      
      // Send email using our direct implementation
      console.log('Sending email via direct Gmail API instead of backend');
      const result = await sendEmailToLead(lead, {
        subject: requestData.subject,
        body: requestData.body
      });
      
      // Return a simulated successful response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          message: 'Email sent via Gmail API directly',
          id: 'direct_' + Date.now()
        }),
        text: () => Promise.resolve(JSON.stringify({
          success: true,
          message: 'Email sent via Gmail API directly',
          id: 'direct_' + Date.now()
        }))
      });
    } catch (error) {
      console.error('Error in email interception:', error);
      
      // Return a simulated error response
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          error: error.message || 'Failed to send email'
        }),
        text: () => Promise.resolve(JSON.stringify({
          success: false,
          error: error.message || 'Failed to send email'
        }))
      });
    }
  }
  
  // For all other requests, use the original fetch
  return originalFetch.apply(this, arguments);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
) 