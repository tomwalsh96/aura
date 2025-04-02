import * as Location from 'expo-location';

export interface LocationData {
  city: string;
  country: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// This was a failed attempt at getting the user's location to determine the closest business / city
// I ran into numerious issues with this, one being the model being able to get the data, but refusing to use it (likley a safety guardrail)
export class LocationService {
  private static instance: LocationService;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    try {
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      if (currentStatus === 'granted') {
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
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

  async getCurrentLocation(): Promise<Coordinates> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
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
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async getClosestCityToUser(): Promise<LocationData> {
    try {
      // First check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        throw new Error('Location services are disabled. Please enable them in your device settings.');
      }

      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('Current permission status:', currentStatus);

      // If not granted, request permission
      if (currentStatus !== 'granted') {
        console.log('Requesting location permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Permission request result:', status);
        
        if (status !== 'granted') {
          throw new Error('Location permission denied. Please enable location access in your device settings.');
        }
      }

      // Get current position with high accuracy
      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      console.log('Got position:', location);

      // Reverse geocode to get city
      console.log('Reverse geocoding coordinates...');
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      console.log('Reverse geocode result:', address);

      if (!address?.city) {
        throw new Error('Could not determine city from location. Please try again or check your location settings.');
      }

      return {
        city: address.city,
        country: address.country || 'Ireland'
      };
    } catch (error) {
      console.error('Error in getClosestCityToUser:', error);
      throw error;
    }
  }
}