import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Business } from '@/types/business';

interface SelectedBusinessProps {
  business: Business | null;
  onReset: () => void;
}

export const SelectedBusiness: React.FC<SelectedBusinessProps> = ({ business, onReset }) => {
  if (!business) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selected Business</Text>
        <TouchableOpacity onPress={onReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Change Selection</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.businessCard}>
        <Image 
          source={{ uri: business.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.details}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.type}>{business.type}</Text>
          <Text style={styles.rating}>★ {business.rating} ({business.reviews} reviews)</Text>
          <Text style={styles.address}>{business.address}</Text>
          <Text style={styles.city}>{business.city}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  businessCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 120,
  },
  details: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#FFB800',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  city: {
    fontSize: 14,
    color: '#666',
  },
}); 