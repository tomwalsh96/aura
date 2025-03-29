import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, TouchableOpacity, Text, ActivityIndicator, ScrollView } from 'react-native';
import { BusinessListItem } from '../../components/pages/explore/BusinessListItem';
import { dummyBusinesses } from '../../data/dummyBusinesses';
import { Business, BusinessType } from '../../types/business';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const categories: { id: BusinessType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: BusinessType.BARBERSHOP, label: 'Barbershop', icon: 'cut', color: '#A8D1FF' },
  { id: BusinessType.HAIR_SALON, label: 'Hair Salon', icon: 'water', color: '#FFB6D9' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BusinessType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleBusinessPress = (business: Business) => {
    router.push({
      pathname: '/explore/[id]',
      params: { id: business.id }
    });
  };

  const filteredBusinesses = dummyBusinesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || business.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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
}); 