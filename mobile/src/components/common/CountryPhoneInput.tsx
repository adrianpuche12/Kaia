import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { COUNTRIES, Country } from '../../data/countries';
import { theme } from '../../theme';

interface CountryPhoneInputProps {
  value: string;
  onChangeText: (phone: string) => void;
  onChangeCountry?: (country: Country) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChangeText,
  onChangeCountry,
  label = 'Teléfono',
  placeholder = '11 1234-5678',
  error,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Argentina por defecto
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    onChangeCountry?.(country);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleSelectCountry(item)}
    >
      <View style={styles.flagContainer}>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryDialCode}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        {/* Country Selector */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.miniFlag}>
            <Text style={styles.miniFlagText}>{selectedCountry.code}</Text>
          </View>
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        {/* Phone Input */}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.text.disabled}
          blurOnSubmit={false}
          returnKeyType="done"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Country Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar País</Text>
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
              placeholder="Buscar país..."
              placeholderTextColor={theme.colors.text.disabled}
            />

            {/* Countries List */}
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={item => item.code}
              style={styles.countriesList}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: theme.colors.status.error,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.default,
  },
  miniFlag: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  miniFlagText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  dialCode: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  chevron: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
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
  countriesList: {
    paddingHorizontal: theme.spacing.xl,
  },
  countryItem: {
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
  countryName: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  countryDialCode: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
});
