import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { contactAPI } from '../services/api';
import { Contact } from '../types';

interface ContactDetailScreenProps {
  route?: {
    params?: {
      contactId?: string;
    };
  };
  navigation?: any;
}

export default function ContactDetailScreen({ route, navigation }: ContactDetailScreenProps) {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const contactId = route?.params?.contactId;
  const isNewContact = !contactId;

  const [loading, setLoading] = useState(!isNewContact);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState<Partial<Contact>>({
    name: '',
    phone: '',
    email: '',
    favorite: false,
    tags: [],
  });

  useEffect(() => {
    if (contactId) {
      loadContact();
    }
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      const data = await contactAPI.getContactById(contactId);
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
      Alert.alert('Error', 'No se pudo cargar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contact.name?.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);

      if (isNewContact) {
        await contactAPI.createContact({
          name: contact.name!,
          phone: contact.phone,
          email: contact.email,
          favorite: contact.favorite,
          tags: contact.tags,
        });
        Alert.alert('Éxito', 'Contacto creado correctamente', [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]);
      } else {
        await contactAPI.updateContact(contactId!, {
          name: contact.name!,
          phone: contact.phone,
          email: contact.email,
          favorite: contact.favorite,
          tags: contact.tags,
        });
        Alert.alert('Éxito', 'Contacto actualizado correctamente', [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'No se pudo guardar el contacto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Eliminar Contacto',
      '¿Estás seguro de que quieres eliminar este contacto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactAPI.deleteContact(contactId!);
              Alert.alert('Éxito', 'Contacto eliminado', [
                {
                  text: 'OK',
                  onPress: () => navigation?.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el contacto');
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    Alert.prompt(
      'Nueva Etiqueta',
      'Ingresa el nombre de la etiqueta',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: (tag) => {
            if (tag?.trim()) {
              setContact((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tag.trim()],
              }));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setContact((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  if (!fontsLoaded || loading) {
    return (
      <LinearGradient
        colors={brandStyles.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={brandStyles.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_700Bold' }]}>
            {isNewContact ? 'Nuevo Contacto' : 'Editar Contacto'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa el nombre"
                placeholderTextColor={theme.colors.textSecondary}
                value={contact.name}
                onChangeText={(text) => setContact({ ...contact, name: text })}
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="+34 600 000 000"
                placeholderTextColor={theme.colors.textSecondary}
                value={contact.phone}
                onChangeText={(text) => setContact({ ...contact, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="contacto@ejemplo.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={contact.email}
                onChangeText={(text) => setContact({ ...contact, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Favorite */}
            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>⭐ Favorito</Text>
                <Switch
                  value={contact.favorite}
                  onValueChange={(value) => setContact({ ...contact, favorite: value })}
                  trackColor={{ false: '#ccc', true: theme.colors.primary }}
                  thumbColor={contact.favorite ? theme.colors.primaryLight : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Tags */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Etiquetas</Text>
              <View style={styles.tagsContainer}>
                {contact.tags?.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Text style={styles.tagRemove}>×</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                  <Text style={styles.addTagText}>+ Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Guardando...' : 'Guardar Contacto'}
              </Text>
            </TouchableOpacity>

            {!isNewContact && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Eliminar Contacto</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 36,
    color: theme.colors.white,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tagRemove: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  addTagButton: {
    backgroundColor: 'rgba(114, 86, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addTagText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  deleteButton: {
    backgroundColor: theme.colors.tertiary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.white,
  },
});
