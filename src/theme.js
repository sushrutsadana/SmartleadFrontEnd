import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      teal: '#00838F',     // Primary teal from logo
      tealHover: '#00A3B3',
      blue: '#2B3990',     // Blue from logo
      blueHover: '#364AB3',
      textDark: '#1E1E1E',    // Headlines
      textGray: '#4D4D4D',    // Body text
      background: '#FFFFFF',   // Main background
      // Enhanced gradients
      gradient: {
        primary: 'linear-gradient(135deg, #00838F 0%, #2B3990 100%)',
        sidebar: 'linear-gradient(180deg, #F8FCFC 0%, #FFFFFF 100%)',
        card: 'linear-gradient(135deg, #FFFFFF 0%, #F8FCFC 100%)',
        accent: 'linear-gradient(135deg, #00838F15 0%, #2B399015 100%)',
        text: 'linear-gradient(135deg, #00838F 0%, #2B3990 100%)'
      }
    }
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'brand.background',
        color: 'brand.textGray'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '500',
        transition: 'all 0.2s ease-in-out',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bgGradient: 'brand.gradient.primary',
          color: 'white',
          _hover: {
            bgGradient: 'linear-gradient(135deg, #00A3B3 0%, #364AB3 100%)',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          }
        },
        ghost: {
          color: 'brand.textDark',
          _hover: {
            bg: 'brand.gradient.accent',
            transform: 'translateY(-1px)',
          }
        }
      }
    },
    Heading: {
      baseStyle: {
        color: 'brand.textDark',
        fontWeight: 'bold',
      }
    },
    Card: {
      baseStyle: {
        bgGradient: 'brand.gradient.card',
        borderRadius: 'xl',
        boxShadow: 'sm',
        transition: 'all 0.2s ease-in-out',
        _hover: {
          boxShadow: 'md',
          transform: 'translateY(-2px)',
        }
      }
    }
  }
})

export default theme 