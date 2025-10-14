// Estilos compartidos de branding de Kaia
import { theme } from './index';

export const brandStyles = {
  // Logo "Kaia" - Estilo manuscrito
  logo: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  logoSmall: {
    fontFamily: 'Caveat_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  // Contenedor del logo
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius['2xl'],
  },

  logoContainerSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius['2xl'],
  },

  // Subtítulo
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center' as const,
    fontWeight: '300' as const,
    letterSpacing: 0.5,
  },

  subtitleSmall: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center' as const,
    fontWeight: '300' as const,
    letterSpacing: 0.5,
  },

  // Gradientes de fondo
  gradients: {
    primary: [theme.colors.primary.main, theme.colors.secondary.main],
    secondary: [theme.colors.secondary.main, theme.colors.tertiary.main],
    home: [theme.colors.primary.main, theme.colors.tertiary.main],
  },

  // Texto del branding
  brandText: {
    name: 'Kaia',
    tagline: 'Su asistente ideal',
  },
};

export default brandStyles;
