import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export class LocationService {
  private static instance: LocationService;
  private locationSubscription: Location.LocationSubscription | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    try {
      // First check if we already have permission
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus === 'granted') {
        return true;
      }

      // Request permission if we don't have it
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // If permission is denied, show modal to guide user to settings
      if (status === 'denied') {
        return new Promise((resolve) => {
          Alert.alert(
            "Location Services",
            "You previously denied location services. Please manually enable them in your device settings.",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false)
              },
              {
                text: "Open Settings",
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                  resolve(false);
                }
              }
            ]
          );
        });
      }

      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async getLocationFromAddress(address: string): Promise<LocationData> {
    try {
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      const locations = await Location.geocodeAsync(address);
      if (locations.length === 0) {
        throw new Error('No location found for address');
      }

      const location = locations[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: 0, // Geocoding doesn't provide accuracy
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting location from address:', error);
      throw error;
    }
  }

  calculateDistance(location1: LocationData, location2: LocationData): number {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = (location1.latitude * Math.PI) / 180;
    const φ2 = (location2.latitude * Math.PI) / 180;
    const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
    const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in metres
  }

  async startLocationUpdates(callback: (location: LocationData) => void): Promise<void> {
    if (this.locationSubscription) {
      this.stopLocationUpdates();
    }

    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? 0,
          timestamp: location.timestamp,
        });
      }
    );
  }

  stopLocationUpdates(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }
} 