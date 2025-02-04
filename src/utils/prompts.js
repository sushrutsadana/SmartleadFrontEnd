// Default prompts - copied exactly from your components
const DEFAULT_PROMPTS = {
  call: `You are an AI assistant helping to generate phone call Prompt.

Generate a short, professional call script for a lead with these details:
Name: \${lead.first_name} \${lead.last_name}
Company: \${lead.company_name || 'Not specified'}
Status: \${lead.status}

Recent Activities:
\${recentActivities}

Keep the Prompt only 2-3 lines and base it on their recent activity history.

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"script": "Hi [name], this is Chris from SmartLead CRM..."}

Do not include any other text, markdown, or formatting - ONLY the JSON object.`,

  whatsapp: `You are an AI assistant helping to generate WhatsApp messages for leads.

Generate a short, professional WhatsApp message for a lead with these details:
Name: \${lead.first_name} \${lead.last_name}
Company: \${lead.company_name || 'Not specified'}
Status: \${lead.status}

Recent Activities:
\${recentActivities}

Keep the message friendly but professional, and reference their recent activity if relevant.
Keep the message under 200 characters.
Do not include emojis.

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"message": "Hi [name], this is Chris from SmartLead CRM..."}

Do not include any other text, markdown, or formatting - ONLY the JSON object.`,

  email: `You are an AI assistant helping to generate email messages.

Generate a professional email for a lead with these details:
Name: \${lead.first_name} \${lead.last_name}
Company: \${lead.company_name || 'Not specified'}
Status: \${lead.status}

Recent Activities:
\${recentActivities}

Keep the email professional but conversational.
Include a clear call to action.
Keep it concise.

IMPORTANT: Respond with ONLY a JSON object in this EXACT format:
{"subject": "Following up on [topic]", "body": "Hi [name],\\n\\n[email body]\\n\\nBest regards,\\nChris"}`
}

// Get prompt (checks localStorage first, falls back to default)
export const getPrompt = (type) => {
  const customPrompts = JSON.parse(localStorage.getItem('systemPrompts') || '{}')
  return customPrompts[type] || DEFAULT_PROMPTS[type]
}

// Save prompt to localStorage
export const savePrompt = (type, prompt) => {
  const customPrompts = JSON.parse(localStorage.getItem('systemPrompts') || '{}')
  customPrompts[type] = prompt
  localStorage.setItem('systemPrompts', JSON.stringify(customPrompts))
}

// Reset prompt to default
export const resetPrompt = (type) => {
  const customPrompts = JSON.parse(localStorage.getItem('systemPrompts') || '{}')
  delete customPrompts[type]
  localStorage.setItem('systemPrompts', JSON.stringify(customPrompts))
}

export const DEFAULT_PROMPTS_LIST = DEFAULT_PROMPTS 