import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorMessageProps {
  error: Error | string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{errorMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  text: {
    color: '#FF3B30',
    fontSize: 14,
    lineHeight: 20,
  },
}); 