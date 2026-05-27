import { Stack } from 'expo-router';

export default function AuthRoutesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 220,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
