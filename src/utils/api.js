const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'
  : 'https://smartlead-python-six.vercel.app';

// Lead Management
export const createLead = async (leadData) => {
  const response = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(leadData)
  });
  return response.json();
};

export const getLead = async (leadId) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}`);
  return response.json();
};

export const updateLead = async (leadId, leadData) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(leadData)
  });
  return response.json();
};

export const deleteLead = async (leadId) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}`, {
    method: 'DELETE'
  });
  return response.json();
};

export const getAllLeads = async () => {
  const response = await fetch(`${API_BASE}/leads`);
  return response.json();
};

// Lead Actions
export const makeCall = async (leadId) => {
  try {
    console.log('Making call to:', `${API_BASE}/leads/${leadId}/call`);
    const response = await fetch(`${API_BASE}/leads/${leadId}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Call API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Call API Error:', error);
    throw error;
  }
};

export const sendEmail = async (leadId) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

export const sendWhatsApp = async (leadId) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}/whatsapp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Lead Search and Processing
export const processEmails = async (data) => {
  const response = await fetch(`${API_BASE}/process-emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const searchLeads = async (query) => {
  const response = await fetch(`${API_BASE}/leads/search?q=${encodeURIComponent(query)}`);
  return response.json();
};

// Lead Status
export const updateLeadStatus = async (leadId, status) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  return response.json();
};

// Lead Activity
export const getLeadActivity = async (leadId) => {
  const response = await fetch(`${API_BASE}/leads/${leadId}/activity`);
  return response.json();
};

// Error handling wrapper
export const handleApiError = (error) => {
  console.error('API Error:', error);
  throw new Error(error.message || 'An error occurred while making the API call');
};
