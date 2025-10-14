// Sistema de espaciado
export const spacing = {
  // Base spacing unit (4px)
  unit: 4,

  // Spacing scale
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  base: 16, // 16px (default)
  lg: 20,   // 20px
  xl: 24,   // 24px
  '2xl': 32,  // 32px
  '3xl': 40,  // 40px
  '4xl': 48,  // 48px
  '5xl': 64,  // 64px
  '6xl': 80,  // 80px

  // Semantic spacing
  padding: {
    screen: 16,
    card: 16,
    section: 24,
    button: 12,
    input: 12,
  },

  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
  },

  // Border radius
  borderRadius: {
    none: 0,
    xs: 2,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Icon sizes
  iconSize: {
    xs: 12,
    sm: 16,
    base: 20,
    md: 24,
    lg: 32,
    xl: 40,
    '2xl': 48,
  },

  // Avatar sizes
  avatarSize: {
    xs: 24,
    sm: 32,
    base: 40,
    md: 48,
    lg: 64,
    xl: 80,
    '2xl': 96,
  },

  // Button heights
  buttonHeight: {
    sm: 32,
    base: 40,
    md: 48,
    lg: 56,
  },

  // Input heights
  inputHeight: {
    sm: 32,
    base: 40,
    md: 48,
    lg: 56,
  },
};

export type Spacing = typeof spacing;

export default spacing;
