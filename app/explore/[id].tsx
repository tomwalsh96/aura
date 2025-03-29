import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dummyBusinesses } from '../../data/dummyBusinesses';
import { Business } from '../../types/business';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams();
  const business = dummyBusinesses.find((b: Business) => b.id === id);

  if (!business) {
    return (
      <View style={styles.container}>
        <Text>Business not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: business.imageUrl }} 
          style={styles.image} 
        />
        <View style={styles.imageOverlay} />
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{business.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{business.rating}</Text>
            <Text style={styles.reviews}>({business.reviews} reviews)</Text>
          </View>
        </View>

        <Text style={styles.description}>{business.description}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cut" size={20} color="#222222" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Services</Text>
          </View>
          {business.services.map((service: { name: string; price: number; duration: string }, index: number) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDuration}>{service.duration}</Text>
              </View>
              <Text style={styles.servicePrice}>€{service.price}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={20} color="#222222" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Opening Hours</Text>
          </View>
          {Object.entries(business.openingHours).map(([day, hours]) => {
            const hoursString = hours as string;
            return (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.day}>{day}</Text>
                <Text style={styles.hours}>{hoursString}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#222222" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.address}>{business.address}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
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
    color: '#222222',
  },
  reviews: {
    fontSize: 14,
    color: '#717171',
    marginLeft: 4,
  },
  description: {
    fontSize: 16,
    color: '#222222',
    marginBottom: 24,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222222',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#717171',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  day: {
    fontSize: 16,
    color: '#222222',
  },
  hours: {
    fontSize: 16,
    color: '#717171',
  },
  address: {
    fontSize: 16,
    color: '#717171',
    lineHeight: 24,
  },
}); 