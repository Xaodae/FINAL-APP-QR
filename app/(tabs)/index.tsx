import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';
import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((profile) => {
      setRole(profile?.role ?? 'student');
    });
  }, [user]);

  if (role === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.muted}>Loading your role...</Text>
      </SafeAreaView>
    );
  }

  const isTeacher = role === 'teacher';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Header title="QR Attendance" />
      </View>

      <View style={styles.content}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>

        {isTeacher ? (
          <>
            <Text style={styles.subtitle}>
              Create or manage events from the Teacher tab
            </Text>
            <AppButton
              theme="primary"
              title="Go to Teacher Tab"
              icon="clipboard-outline"
              onPress={() => router.push('/(tabs)/teacher')}
            />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Scan event QR codes to record your attendance instantly.
            </Text>
            <AppButton
              theme="primary"
              title="Scan QR Code"
              icon="qr-code-outline"
              onPress={() => router.push('/scan')}
            />
          </>
        )}

        <AppButton
          title="Attendance History"
          icon="time-outline"
          onPress={() => router.push('/history')}
        />
        <AppButton
          title="Profile"
          icon="person-outline"
          onPress={() => router.push('/profile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  muted: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});