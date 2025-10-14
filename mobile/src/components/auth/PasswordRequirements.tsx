// Componente para mostrar requisitos de contraseña en tiempo real
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  confirmPassword,
}) => {
  const requirements: PasswordRequirement[] = [
    {
      label: 'Mínimo 8 caracteres',
      met: password.length >= 8,
    },
    {
      label: 'Al menos una mayúscula',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Al menos una minúscula',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Al menos un número',
      met: /[0-9]/.test(password),
    },
  ];

  // Solo agregar el requisito de confirmación si se proporcionó
  if (confirmPassword !== undefined) {
    requirements.push({
      label: 'Las contraseñas coinciden',
      met: password === confirmPassword && password.length > 0,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requisitos de contraseña:</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementRow}>
          <View style={[styles.indicator, req.met && styles.indicatorMet]}>
            <Text style={[styles.indicatorText, req.met && styles.indicatorTextMet]}>
              {req.met ? '✓' : '○'}
            </Text>
          </View>
          <Text style={[styles.requirementText, req.met && styles.requirementTextMet]}>
            {req.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background.default,
    borderWidth: 2,
    borderColor: theme.colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  indicatorMet: {
    backgroundColor: theme.colors.status.success,
    borderColor: theme.colors.status.success,
  },
  indicatorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  indicatorTextMet: {
    color: '#FFFFFF',
  },
  requirementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
  },
  requirementTextMet: {
    color: theme.colors.status.success,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default PasswordRequirements;
