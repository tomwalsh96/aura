import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationService } from '../../../services/locationService';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const locationService = LocationService.getInstance();

  const checkLocationPermission = async () => {
    const hasPermission = await locationService.checkPermission();
    setLocationEnabled(hasPermission);
  };

  // Check permission when the component mounts
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Check permission when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkLocationPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLocationToggle = async () => {
    if (locationEnabled) {
      // Show alert to guide user to device settings
      Alert.alert(
        "Location Services",
        "To disable location services, please go to your device settings.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
    } else {
      // Request location permission
      const granted = await locationService.requestPermission();
      setLocationEnabled(granted);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={24} color="#222222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.divider} />
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLocationToggle}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="location-outline" size={24} color="#222222" />
            <Text style={styles.menuItemText}>Location Services</Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={handleLocationToggle}
            trackColor={{ false: '#E5E5EA', true: '#4A90E2' }}
            thumbColor="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  section: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#222222',
    marginLeft: 16,
  },
}); 