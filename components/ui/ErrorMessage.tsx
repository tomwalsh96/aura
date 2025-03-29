import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getReadableErrorMessage } from '../../utils/errorMessages';

interface ErrorMessageProps {
  error: any;
  style?: any;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, style }) => {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{getReadableErrorMessage(error)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  text: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
  },
}); 