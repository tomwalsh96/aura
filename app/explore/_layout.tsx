import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { dummyBusinesses } from '../../data/dummyBusinesses';

export default function ExploreLayout() {
  const { id } = useLocalSearchParams();
  
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}