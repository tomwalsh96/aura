import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { AuthScreen } from '../../../components/pages/profile/AuthScreen';
import { ProfileScreen } from '../../../components/pages/profile/ProfileScreen';

export default function ProfileTab() {
  const { user } = useAuth();
  const router = useRouter();

  // Ensure we're on the profile tab
  React.useEffect(() => {
    router.setParams({});
  }, []);

  return (
    <View style={styles.container}>
      {user ? <ProfileScreen /> : <AuthScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 