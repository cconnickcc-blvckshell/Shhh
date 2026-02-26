import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';

const API_BASE = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

interface Props {
  storagePath?: string | null;
  photosJson?: any[];
  size: number;
  blurred?: boolean;
  borderRadius?: number;
}

export function ProfilePhoto({ storagePath, photosJson, size, blurred, borderRadius: br }: Props) {
  const photoUrl = storagePath
    ? `${API_BASE}/uploads${storagePath}`
    : photosJson && photosJson.length > 0 && typeof photosJson[0] === 'string'
      ? `${API_BASE}/uploads${photosJson[0]}`
      : null;

  if (!photoUrl) {
    return (
      <View style={[styles.placeholder, { width: size, height: size, borderRadius: br ?? size / 2 }]}>
        <Ionicons name="person" size={size * 0.4} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={[
        { width: size, height: size, borderRadius: br ?? size / 2 },
        blurred && styles.blurred,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurred: {
    opacity: 0.3,
  },
});
