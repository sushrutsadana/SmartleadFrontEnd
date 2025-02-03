export const brandColors = {
  primary: {
    teal: "#008B9B",      // Main brand color
    blue: "#1A365D",      // Secondary color
    gradient: {
      start: "#008B9B",
      end: "#1A365D"
    }
  },
  background: {
    light: "#F7FAFC",     // Light background
    white: "#FFFFFF",     // Pure white
    card: "#FFFFFF"       // Card background
  },
  text: {
    primary: "#2D3748",   // Main text
    secondary: "#4A5568", // Secondary text
    muted: "#718096"      // Muted text
  },
  border: {
    light: "#E2E8F0",    // Light borders
    medium: "#CBD5E0"     // Medium borders
  }
}

export const spacing = {
  layout: {
    pagePadding: { base: 4, md: 6, lg: 8 },
    contentMaxWidth: "1800px",
    sidebarWidth: "280px"
  }
}

export const typography = {
  heading: {
    primary: {
      fontSize: { base: "2xl", md: "3xl" },
      fontWeight: "bold",
      color: "text.primary"
    },
    secondary: {
      fontSize: { base: "xl", md: "2xl" },
      fontWeight: "semibold",
      color: "text.primary"
    },
    section: {
      fontSize: { base: "lg", md: "xl" },
      fontWeight: "semibold",
      color: "text.primary"
    }
  },
  body: {
    regular: {
      fontSize: "md",
      color: "text.primary"
    },
    small: {
      fontSize: "sm",
      color: "text.secondary"
    }
  }
} 