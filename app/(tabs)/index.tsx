import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { BusinessListItem } from '../../components/pages/explore/BusinessListItem';
import { Business } from '../../types/business';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config';

const categories: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'barbershop', label: 'Barbershop', icon: 'cut', color: '#A8D1FF' },
  { id: 'salon', label: 'Hair Salon', icon: 'water', color: '#FFB6D9' },
  { id: 'spa', label: 'Spa', icon: 'sparkles', color: '#FFD6A5' },
  { id: 'nails', label: 'Nails', icon: 'hand-left', color: '#FFA5A5' },
  { id: 'massage', label: 'Massage', icon: 'fitness', color: '#A5FFA5' },
  { id: 'wellness', label: 'Wellness', icon: 'leaf', color: '#A5FFD6' }
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for businesses collection
    const unsubscribe = onSnapshot(
      collection(db, 'businesses'),
      (snapshot) => {
        const businessesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Business[];
        setBusinesses(businessesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to businesses:', err);
        setError('Failed to load businesses. Please try again.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleBusinessPress = (business: Business) => {
    router.push({
      pathname: '/explore/[id]',
      params: { id: business.id }
    });
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || business.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // No need to fetch manually as the listener will update automatically
    setRefreshing(false);
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading businesses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setLoading(true);
          setError(null);
          // No need to fetch manually as the listener will update automatically
          setRefreshing(false);
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { borderColor: category.color },
                selectedCategory === category.id && { backgroundColor: category.color }
              ]}
              onPress={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
            >
              <Ionicons
                name={category.icon}
                size={16}
                color={selectedCategory === category.id ? '#222222' : category.color}
              />
              <Text style={[
                styles.categoryLabel,
                { color: category.color },
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredBusinesses}
        renderItem={({ item }) => (
          <BusinessListItem
            business={item}
            onPress={handleBusinessPress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No businesses found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 1,
  },
  categoryLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  categoryLabelActive: {
    color: '#222222',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  retryButton: {
    marginTop: 24,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 