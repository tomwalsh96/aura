import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { ErrorMessage } from '../components/ui/ErrorMessage';

export const ProfileScreen = () => {
  const [error, setError] = useState<any>(null);

  const handleSignOut = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>

        <ErrorMessage error={error} />

        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 