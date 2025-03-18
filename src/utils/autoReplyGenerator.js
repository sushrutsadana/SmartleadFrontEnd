import axios from 'axios';

export const generateAutoReply = async (email, lead = null) => {
  try {
    const payload = {
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping to generate an auto-reply email.
          
Generate a short, professional auto-reply for the following incoming email. 
The auto-reply should:
1. Thank the sender for their message
2. Mention that you'll review it shortly
3. Provide a brief personalized response based on the email content
4. End with a professional closing

Keep it concise (3-4 sentences max) and friendly.`
        },
        {
          role: "user",
          content: `Original email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}

${lead ? `Lead information:
Name: ${lead.first_name} ${lead.last_name || ''}
Company: ${lead.company_name || 'Unknown'}` : ''}

Generate an appropriate auto-reply.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    };

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating auto-reply:', error);
    return `Thank you for your email. I'll get back to you shortly.

Best regards,
SmartLead Team`;
  }
}; 