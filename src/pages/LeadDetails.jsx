import { sendEmailToLead } from '../components/EmailProcessor';

const handleSendEmail = async () => {
  try {
    setIsSending(true);
    
    const result = await sendEmailToLead(lead, {
      subject: `Following up on your interest in our services`,
      body: `Hello ${lead.first_name || 'there'},

Thank you for your interest in our services. I wanted to follow up on your recent inquiry.

Would you have some time this week for a quick call to discuss how we can help?

Best regards,
${currentUser?.name || 'The Sales Team'}`
    });
    
    if (result.success) {
      toast({
        title: 'Email Sent',
        description: result.message || 'Your email has been sent successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      fetchLeadActivities();
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Error in sendEmail handler:', error);
    toast({
      title: 'Error',
      description: error.message || 'Failed to send email',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setIsSending(false);
  }
};

<Button
  leftIcon={<Icon as={FiMail} />}
  colorScheme="blue"
  onClick={handleSendEmail}
  isLoading={isSending}
>
  Send Email
</Button> 