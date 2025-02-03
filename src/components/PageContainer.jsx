import { Box } from '@chakra-ui/react'
import { spacing } from '../theme/constants'

function PageContainer({ children }) {
  return (
    <Box
      px={spacing.layout.pagePadding}
      py={6}
      maxW={spacing.layout.contentMaxWidth}
      w="100%"
      mx="auto"
    >
      {children}
    </Box>
  )
}

export default PageContainer 