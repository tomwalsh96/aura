import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useBusinessData } from '../../hooks/useBusinessData';

// Loading component
const LoadingView = () => (
  <View style={styles.loadingContainer}>
    <Text>Loading...</Text>
  </View>
);

// Error component
const ErrorView = ({ message }: { message: string }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

// Business header component
const BusinessHeader = ({ business }: { business: NonNullable<ReturnType<typeof useBusinessData>['business']> }) => (
  <View style={styles.header}>
    <Image source={{ uri: business.imageUrl }} style={styles.image} />
    <Text style={styles.name}>{business.name}</Text>
    <View style={styles.ratingContainer}>
      <Text style={styles.rating}>★ {business.rating}</Text>
      <Text style={styles.reviews}>({business.reviews} reviews)</Text>
    </View>
  </View>
);

// Business info component
const BusinessInfo = ({ business }: { business: NonNullable<ReturnType<typeof useBusinessData>['business']> }) => (
  <View style={styles.infoSection}>
    <Text style={styles.description}>{business.description}</Text>
    <Text style={styles.address}>{business.address}</Text>
    <View style={styles.hoursContainer}>
      <Text style={styles.sectionTitle}>Opening Hours</Text>
      {Object.entries(business.openingHours).map(([day, hours]) => (
        <View key={day} style={styles.hoursRow}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.hours}>{hours}</Text>
        </View>
      ))}
    </View>
  </View>
);

// Staff section component
const StaffSection = ({ staff }: { staff: ReturnType<typeof useBusinessData>['staff'] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Our Team</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {staff.map((member) => (
        <View key={member.id} style={styles.staffCard}>
          <Image source={{ uri: member.imageUrl }} style={styles.staffImage} />
          <Text style={styles.staffName}>{member.name}</Text>
          <Text style={styles.staffRole}>{member.role}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// Services section component
const ServicesSection = ({ services }: { services: ReturnType<typeof useBusinessData>['services'] }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Services</Text>
    {services.map((service) => (
      <View key={service.id} style={styles.serviceCard}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.servicePrice}>€{service.price}</Text>
        <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
      </View>
    ))}
  </View>
);

// Booking button component
const BookingButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity style={styles.bookButton} onPress={onPress}>
    <Text style={styles.bookButtonText}>Book Now</Text>
  </TouchableOpacity>
);

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { business, staff, services, loading, error } = useBusinessData(id);

  if (loading) {
    return <LoadingView />;
  }

  if (error || !business) {
    return <ErrorView message={error || 'Business not found'} />;
  }

  const handleBooking = () => {
    router.push(`/booking/${id}`);
  };

  return (
    <ScrollView style={styles.container}>
      <BusinessHeader business={business} />
      <BusinessInfo business={business} />
      <StaffSection staff={staff} />
      <ServicesSection services={services} />
      <BookingButton onPress={handleBooking} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 5,
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  hoursContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  day: {
    fontSize: 14,
    fontWeight: '500',
  },
  hours: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  staffCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 120,
  },
  staffImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
  },
  serviceCard: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 5,
  },
  servicePrice: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 5,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
}); 