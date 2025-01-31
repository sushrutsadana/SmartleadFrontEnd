import { Box, Container, Heading } from '@chakra-ui/react'

function MakeCall() {
  return (
    <Container maxW="container.xl" p={4}>
      <Box borderWidth="1px" borderRadius="lg" p={6}>
        <Heading size="lg">Make Call</Heading>
        {/* Add call functionality here */}
      </Box>
    </Container>
  )
}

export default MakeCall
