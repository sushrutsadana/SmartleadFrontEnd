import { Box, Heading, Text, HStack, VStack } from '@chakra-ui/react'
import { typography, brandColors } from '../theme/constants'

function PageHeader({ title, description, children }) {
  return (
    <Box mb={8} pt={6}>
      <HStack justify="space-between" align="top" spacing={4}>
        <VStack align="start" spacing={2}>
          <Heading
            as="h1"
            color={brandColors.text.primary}
            {...typography.heading.primary}
          >
            {title}
          </Heading>
          {description && (
            <Text
              color={brandColors.text.secondary}
              {...typography.body.regular}
            >
              {description}
            </Text>
          )}
        </VStack>
        {children}
      </HStack>
    </Box>
  )
}

export default PageHeader 