import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  Keyboard,
} from 'react-native';
import { COUNTRIES, Country, State } from '../../data/countries';
import { theme } from '../../theme';

interface LocationPickerProps {
  country?: string;
  state?: string;
  city?: string;
  onChangeCountry: (country: string) => void;
  onChangeState: (state: string) => void;
  onChangeCity: (city: string) => void;
  label?: string;
  error?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  country,
  state,
  city,
  onChangeCountry,
  onChangeState,
  onChangeCity,
  label = 'Ubicación',
  error,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'country' | 'state' | 'city'>('country');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');

  const openModal = (type: 'country' | 'state' | 'city') => {
    if (type === 'state' && !selectedCountry) {
      return; // No se puede seleccionar estado sin país
    }
    if (type === 'city' && !selectedState) {
      return; // No se puede seleccionar ciudad sin estado
    }
    Keyboard.dismiss(); // Cierra el teclado antes de abrir el modal
    setModalType(type);
    setSearchQuery('');
    setModalVisible(true);
  };

  const handleSelectCountry = (countryItem: Country) => {
    setSelectedCountry(countryItem);
    setSelectedState(null);
    setSelectedCity('');
    onChangeCountry(countryItem.name);
    onChangeState('');
    onChangeCity('');
    setModalVisible(false);
  };

  const handleSelectState = (stateItem: State) => {
    setSelectedState(stateItem);
    setSelectedCity('');
    onChangeState(stateItem.name);
    onChangeCity('');
    setModalVisible(false);
  };

  const handleSelectCity = (cityName: string) => {
    setSelectedCity(cityName);
    onChangeCity(cityName);
    setModalVisible(false);
  };

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStates = selectedCountry?.states?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCities = selectedState?.cities?.filter(c =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectCountry(item)}
    >
      <View style={styles.flagContainer}>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderStateItem = ({ item }: { item: State }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectState(item)}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.itemCount}>({item.cities.length} ciudades)</Text>
    </TouchableOpacity>
  );

  const renderCityItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleSelectCity(item)}
    >
      <Text style={styles.itemText}>{item}</Text>
    </TouchableOpacity>
  );

  const getModalTitle = () => {
    switch (modalType) {
      case 'country':
        return 'Seleccionar País';
      case 'state':
        return 'Seleccionar Provincia/Estado';
      case 'city':
        return 'Seleccionar Ciudad';
    }
  };

  const getModalData = () => {
    switch (modalType) {
      case 'country':
        return filteredCountries;
      case 'state':
        return filteredStates;
      case 'city':
        return filteredCities;
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    switch (modalType) {
      case 'country':
        return renderCountryItem({ item });
      case 'state':
        return renderStateItem({ item });
      case 'city':
        return renderCityItem({ item });
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.selectorsRow}>
        {/* Country Selector */}
        <TouchableOpacity
          style={[styles.selector, styles.selectorFull, error && styles.selectorError]}
          onPress={() => openModal('country')}
          activeOpacity={0.7}
        >
          <Text style={styles.selectorLabel}>País</Text>
          <View style={styles.selectorValueContainer}>
            {selectedCountry && (
              <View style={styles.miniFlag}>
                <Text style={styles.miniFlagText}>{selectedCountry.code}</Text>
              </View>
            )}
            <Text style={selectedCountry ? styles.selectorValue : styles.selectorPlaceholder}>
              {selectedCountry ? selectedCountry.name : 'Seleccionar...'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* State Selector (always visible, but disabled if no country) */}
      <TouchableOpacity
        style={[
          styles.selector,
          styles.selectorFull,
          !selectedCountry && styles.selectorDisabled
        ]}
        onPress={() => openModal('state')}
        disabled={!selectedCountry || !selectedCountry.states}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorLabel}>Provincia/Estado</Text>
        <Text style={selectedState ? styles.selectorValue : styles.selectorPlaceholder}>
          {selectedState ? selectedState.name : 'Seleccionar...'}
        </Text>
      </TouchableOpacity>

      {/* City Selector (always visible, but disabled if no state) */}
      <TouchableOpacity
        style={[
          styles.selector,
          styles.selectorFull,
          !selectedState && styles.selectorDisabled
        ]}
        onPress={() => openModal('city')}
        disabled={!selectedState}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorLabel}>Ciudad</Text>
        <Text style={selectedCity ? styles.selectorValue : styles.selectorPlaceholder}>
          {selectedCity || 'Seleccionar...'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar..."
              placeholderTextColor={theme.colors.text.disabled}
            />

            {/* List */}
            <FlatList
              data={getModalData()}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                typeof item === 'string' ? item : item.code || item.id || index.toString()
              }
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectorsRow: {
    gap: theme.spacing.sm,
  },
  selector: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selectorFull: {
    width: '100%',
  },
  selectorError: {
    borderColor: theme.colors.status.error,
  },
  selectorDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.background.default,
  },
  selectorLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  selectorValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniFlag: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  miniFlagText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  selectorValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  selectorPlaceholder: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.disabled,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.status.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    maxHeight: '80%',
    paddingTop: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  searchInput: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  list: {
    paddingHorizontal: theme.spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  itemText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  itemCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
