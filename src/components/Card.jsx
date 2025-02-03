import { Box } from '@chakra-ui/react'
import { brandColors } from '../theme/constants'

function Card({ children, noPadding, ...props }) {
  return (
    <Box
      bg={brandColors.background.card}
      borderRadius="xl"
      boxShadow="sm"
      border="1px solid"
      borderColor={brandColors.border.light}
      p={noPadding ? 0 : 6}
      {...props}
    >
      {children}
    </Box>
  )
}

export default Card 