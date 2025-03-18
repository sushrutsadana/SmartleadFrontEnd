import { supabase } from '../supabaseClient';

// Create a browser-compatible base64 encoder for email
const createEmailRFC822 = (from, to, subject, body) => {
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

  return btoa(message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Token refresh function
const refreshAccessToken = async (email) => {
  try {
    const { data, error } = await supabase
      .from('gmail_credentials')
      .select('refresh_token')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    if (!data || !data.refresh_token) {
      throw new Error('No refresh token found. Please reconnect your Gmail account.');
    }
    
    const tokenResponse = await fetch(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
          refresh_token: data.refresh_token,
          grant_type: 'refresh_token'
        })
      }
    );
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to refresh access token');
    }
    
    const { error: updateError } = await supabase
      .from('gmail_credentials')
      .update({
        access_token: tokenData.access_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      })
      .eq('email', email);
    
    if (updateError) throw updateError;
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
};

// Send email function
export const sendEmailToLead = async (lead, emailContent) => {
  try {
    if (!lead || !lead.id || !lead.email) {
      throw new Error('Missing required lead information');
    }
    
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
    
    try {
      accessToken = await refreshAccessToken(senderEmail);
    } catch (refreshError) {
      throw new Error('Failed to refresh Gmail token: ' + refreshError.message);
    }
    
    const content = emailContent || {
      subject: `Follow up from SmartLead CRM`,
      body: `Hello ${lead.first_name || 'there'},\n\nThank you for your interest in our services. I'd like to schedule a time to discuss how we can help you further.\n\nBest regards,\nYour Sales Team`
    };
    
    const emailString = [
      `From: ${senderEmail}`,
      `To: ${lead.email}`,
      `Subject: ${content.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      '',
      content.body
    ].join('\r\n');
    
    const encodedEmail = btoa(unescape(encodeURIComponent(emailString)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gmail API error (${response.status}): ${errorText}`);
    }
    
    // Record the email activity
    await supabase
      .from('activities')
      .insert([{
        lead_id: lead.id,
        activity_type: 'email_sent',
        body: `Email sent: ${content.subject}`,
      }]);
    
    return { 
      success: true, 
      message: 'Email sent successfully via Gmail'
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}; 