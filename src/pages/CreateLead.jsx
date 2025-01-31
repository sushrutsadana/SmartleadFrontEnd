import { Box, Container, Heading } from '@chakra-ui/react'

function CreateLead() {
  return (
    <Container maxW="container.xl" p={4}>
      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading size="lg">Create Lead</Heading>
        {/* Add lead creation form here */}
      </Box>
    </Container>
  )
}

export default CreateLead