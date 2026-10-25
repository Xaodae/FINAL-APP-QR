import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform, } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';
import { registerAttendance } from '@/lib/attendance';

export default function ScanScreen() {
  const { user } = useAuth();
  
  // Web platform doesn't have camera access - show info screen
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.webTitle}>Web Version</Text>
        <Text style={styles.webSubtitle}>
          QR code scanning is not available on the web version because 
          your device doesn't have a camera accessible from the browser.
        </Text>
        <Text style={styles.webSubtitle}>
          Please use the Android or iOS app to scan QR codes.
        </Text>
        <AppButton
          theme="primary"
          title="Go to Home"
          icon="home-outline"
          onPress={() => {}}
        />
      </View>
    );
  }
  
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<Role | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfileName(null);
      setProfileRole(null);
      setIdentityLoading(false);
      return;
    }
    setIdentityLoading(true);
    getProfile(user.id).then((profile) => {
      if (!active) return;
      setProfileName(profile?.full_name ?? null);
      setProfileRole(profile?.role ?? null);
      setIdentityLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission not granted.');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        setLocationError(null);
      } catch (err: any) {
        setLocationError(err?.message || 'Could not get location.');
      }
    })();
  }, [user]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Camera Access Needed</Text>
        <Text style={styles.subtitle}>
          We need camera access to scan attendance QR codes.
        </Text>
        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera-outline"
          onPress={requestPermission}
        />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLastData(data);

    // Attendance is always recorded for the LOGGED-IN account.
    // Block scans that would record the wrong person.
    if (!user) {
      setMessage('Please log in first. Attendance needs an account.');
      setSuccess(false);
      return;
    }
    if (identityLoading) {
      setMessage('Checking your account... please tap Scan Again.');
      setSuccess(false);
      return;
    }
    if (profileRole === 'teacher') {
      setMessage(
        'Teachers cannot record attendance. Log in with a student account to scan.'
      );
      setSuccess(false);
      return;
    }

    // Get GPS location for geofence check
    const lat = latitude;
    const lng = longitude;

    const result = await registerAttendance(data, user.id, lat, lng);
    setMessage(result.message);
    setSuccess(result.success);
  };

  const identityLabel = identityLoading
    ? 'Checking account...'
    : profileName ?? user?.email ?? 'Not logged in';

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.identityBar}>
          <Text style={styles.identityLabel}>Scanning as:</Text>
          <Text style={styles.identityName} numberOfLines={1}>
            {identityLabel}
          </Text>
        </View>
        {message ? (
          <View style={styles.card}>
            <Text
              style={[styles.message, success ? styles.ok : styles.fail]}
            >
              {message}
            </Text>
            {lastData ? (
              <Text style={styles.raw} numberOfLines={3}>
                {lastData}
              </Text>
            ) : null}
            <AppButton
              theme="primary"
              title="Scan Again"
              icon="refresh-outline"
              onPress={() => {
                setScanned(false);
                setMessage(null);
                setLastData(null);
              }}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.hint}>
              Point the camera at an event QR code
            </Text>
            {locationError && (
              <Text style={styles.error}>Location: {locationError}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 12,
  },
  identityBar: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  identityLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  identityName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorderNeon,
    padding: 20,
    gap: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  hint: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  ok: {
    color: COLORS.success,
  },
  fail: {
    color: COLORS.danger,
  },
  raw: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  error: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 8,
  },
  webContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  webSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
});
