import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { useRouter as useCustomRouter } from 'expo-router';
import { getProfile } from '@/lib/profiles';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useCustomRouter();

  useEffect(() => {
    if (loading) return;

    const path = segments?.[0];
    const inAuthGroup = path === 'login' || path === 'register';
    const inTabsGroup = path === '(tabs)';

    if (!session && inTabsGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!segments?.length && !session) {
      router.replace('/login');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  // Check user role to determine which navigator to show
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);

  useEffect(() => {
    if (!session) return;
    getProfile(session.user.id).then((profile) => {
      setUserRole(profile?.role ?? 'student');
    });
  }, [session]);

  // Determine initial route based on role
  const initialRouteName = userRole === 'teacher' ? '(tabs-teacher)' : '(tabs)';

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(tabs-teacher)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
