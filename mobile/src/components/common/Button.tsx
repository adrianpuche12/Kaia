// Componente Button reutilizable
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[`size_${size}`],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: theme.colors.primary.main };
      case 'secondary':
        return { ...baseStyle, backgroundColor: theme.colors.secondary.main };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary.main,
        };
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    if (variant === 'outline' || variant === 'ghost') {
      return { ...baseTextStyle, color: theme.colors.primary.main };
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary.main : '#FFFFFF'}
        />
      ) : (
        <Text style={[getTextStyle(), disabled && styles.textDisabled, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.spacing.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  size_sm: {
    height: theme.spacing.buttonHeight.sm,
    paddingHorizontal: theme.spacing.md,
  },
  size_md: {
    height: theme.spacing.buttonHeight.base,
    paddingHorizontal: theme.spacing.lg,
  },
  size_lg: {
    height: theme.spacing.buttonHeight.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  text_sm: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_md: {
    fontSize: theme.typography.fontSize.base,
  },
  text_lg: {
    fontSize: theme.typography.fontSize.md,
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
