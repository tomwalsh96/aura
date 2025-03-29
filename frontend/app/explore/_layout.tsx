import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { dummyBusinesses } from '../../src/data/dummyBusinesses';

export default function ExploreLayout() {
  const { id } = useLocalSearchParams();
  
  let title = 'Explore';
  if (id) {
    const business = dummyBusinesses.find(b => b.id === id);
    if (business) {
      title = business.name;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="[id]"
        options={{
          title
        }}
      />
    </Stack>
  );
} 