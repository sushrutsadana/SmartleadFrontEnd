const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

// Endpoint for connecting Gmail
router.post('/gmail-connect', async (req, res) => {
  try {
    const { access_token, refresh_token, email, expires_at } = req.body;
    const userId = req.user.id; // Get from your auth middleware
    
    // Store tokens securely in your database (encrypted)
    await db.userSettings.upsert({
      userId,
      gmailAccessToken: encrypt(access_token),
      gmailRefreshToken: encrypt(refresh_token),
      gmailEmail: email,
      gmailExpiresAt: expires_at
    });
    
    // Initialize the Gmail service with the tokens
    // This ensures they work immediately
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token,
      refresh_token
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Test the connection by getting profile info
    await gmail.users.getProfile({ userId: 'me' });
    
    res.json({ success: true, message: 'Gmail connected successfully' });
  } catch (error) {
    console.error('Gmail connect error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to connect Gmail account',
      error: error.message 
    });
  }
});

// Endpoint for disconnecting Gmail
router.post('/gmail-disconnect', async (req, res) => {
  try {
    const userId = req.user.id; // Get from your auth middleware
    
    // Remove tokens from database
    await db.userSettings.update({
      where: { userId },
      data: {
        gmailAccessToken: null,
        gmailRefreshToken: null,
        gmailEmail: null,
        gmailExpiresAt: null
      }
    });
    
    res.json({ success: true, message: 'Gmail disconnected successfully' });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disconnect Gmail account',
      error: error.message 
    });
  }
});

module.exports = router; 