import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { Business } from '../../types/business';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  workingDays: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  staffIds: string[];
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for business document
    const unsubscribeBusiness = onSnapshot(
      doc(db, 'businesses', id as string),
      (doc) => {
        if (doc.exists()) {
          setBusiness({ id: doc.id, ...doc.data() } as Business);
        } else {
          setError('Business not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to business:', err);
        setError('Failed to load business details');
        setLoading(false);
      }
    );

    // Set up real-time listener for staff subcollection
    const unsubscribeStaff = onSnapshot(
      collection(db, 'businesses', id as string, 'staff'),
      (snapshot) => {
        const staffData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StaffMember[];
        setStaff(staffData);
      },
      (err) => {
        console.error('Error listening to staff:', err);
      }
    );

    // Set up real-time listener for services subcollection
    const unsubscribeServices = onSnapshot(
      collection(db, 'businesses', id as string, 'services'),
      (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);
      },
      (err) => {
        console.error('Error listening to services:', err);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeBusiness();
      unsubscribeStaff();
      unsubscribeServices();
    };
  }, [id]);

  const handleBookingPress = () => {
    router.push({
      pathname: '/booking/[id]',
      params: { id }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Business not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: business.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{business.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{business.rating}</Text>
            <Text style={styles.reviews}>({business.reviews} reviews)</Text>
          </View>
        </View>

        <Text style={styles.description}>{business.description}</Text>
        
        <View style={styles.infoSection}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{business.address}</Text>
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoText}>Open {business.openingHours[new Date().toLocaleDateString('en-IE', { weekday: 'long' })]}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffContainer}>
            {staff.map((member) => (
              <View key={member.id} style={styles.staffCard}>
                <Image source={{ uri: member.imageUrl }} style={styles.staffImage} />
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffRole}>{member.role}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>€{service.price}</Text>
              </View>
              <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBookingPress}>
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  staffContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  staffCard: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  staffImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  staffRole: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 