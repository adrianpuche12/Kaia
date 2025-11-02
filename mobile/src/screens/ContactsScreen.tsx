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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { contactAPI } from '../services/api';
import { Contact } from '../types';

interface ContactsScreenProps {
  navigation?: any;
}

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'whatsapp' | 'favorites'>('all');

  useEffect(() => {
    loadContacts();
    loadStats();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts, selectedFilter]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await contactAPI.listContacts({
        page: 1,
        limit: 100,
      });
      setContacts(response.data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const contactStats = await contactAPI.getContactStats();
      setStats(contactStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Filtro por tipo
    if (selectedFilter === 'whatsapp') {
      filtered = filtered.filter(c => c.phone && c.phone.startsWith('+'));
    } else if (selectedFilter === 'favorites') {
      filtered = filtered.filter(c => c.favorite);
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      );
    }

    setFilteredContacts(filtered);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      filterContacts();
      return;
    }

    try {
      const results = await contactAPI.searchContacts(searchQuery);
      setFilteredContacts(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
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
              await contactAPI.deleteContact(id);
              setContacts(contacts.filter(c => c.id !== id));
              Alert.alert('Éxito', 'Contacto eliminado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el contacto');
            }
          },
        },
      ]
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => navigation?.navigate('ContactDetail', { contactId: contact.id })}
      onLongPress={() => handleDeleteContact(contact.id)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactDetails}>
        <Text style={styles.contactName}>{contact.name}</Text>
        {contact.phone && (
          <Text style={styles.contactInfo}>📱 {contact.phone}</Text>
        )}
        {contact.email && (
          <Text style={styles.contactInfo}>✉️ {contact.email}</Text>
        )}
        <View style={styles.tagsContainer}>
          {contact.favorite && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>⭐ Favorito</Text>
            </View>
          )}
          {contact.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const StatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.withWhatsApp}</Text>
          <Text style={styles.statLabel}>WhatsApp</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Favoritos</Text>
        </View>
      </View>
    );
  };

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
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_700Bold' }]}>
            Contactos
          </Text>
        </View>

        {/* Stats */}
        <StatsCard />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar contactos..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'all' && styles.filterTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'whatsapp' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('whatsapp')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'whatsapp' && styles.filterTextActive,
              ]}
            >
              WhatsApp
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'favorites' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('favorites')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'favorites' && styles.filterTextActive,
              ]}
            >
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contacts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando contactos...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'No se encontraron contactos'
                    : 'No tienes contactos aún'}
                </Text>
              </View>
            ) : (
              filteredContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))
            )}
          </ScrollView>
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation?.navigate('ContactDetail')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 36,
    color: theme.colors.white,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.white,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.white,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.white,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  tag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.white,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
