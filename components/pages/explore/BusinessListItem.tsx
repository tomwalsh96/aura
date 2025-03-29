import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Business } from '../../../types/business';
import { Ionicons } from '@expo/vector-icons';

interface BusinessListItemProps {
  business: Business;
  onPress: (business: Business) => void;
}

export const BusinessListItem: React.FC<BusinessListItemProps> = ({ business, onPress }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'barber':
        return '#A8D1FF';
      case 'hairstylist':
        return '#FFB6D9';
      default:
        return '#E5E5EA';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(business)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: business.imageUrl }} 
          style={styles.image} 
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
        <View style={styles.typeRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{business.rating}</Text>
          </View>
          <View style={[styles.typeChip, { backgroundColor: getTypeColor(business.type) }]}>
            <Text style={styles.typeText}>{business.type}</Text>
          </View>
        </View>
        <Text style={styles.address} numberOfLines={1}>{business.address}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    height: 100,
  },
  imageContainer: {
    width: 100,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  info: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#222222',
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    color: '#222222',
  },
  address: {
    fontSize: 13,
    color: '#717171',
  },
}); 