// Componente Loading reutilizable
import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

interface LoadingProps {
  visible?: boolean;
  text?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
  containerStyle?: ViewStyle;
}

const Loading: React.FC<LoadingProps> = ({
  visible = true,
  text,
  fullScreen = false,
  size = 'large',
  color = theme.colors.primary.main,
  containerStyle,
}) => {
  if (!visible) return null;

  const content = (
    <View style={[styles.container, !fullScreen && containerStyle]}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>{content}</View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  content: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.spacing.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    minWidth: 120,
    ...theme.shadows.lg,
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});

export default Loading;
