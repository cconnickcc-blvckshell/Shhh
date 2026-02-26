import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../constants/theme';

const API_BASE = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

interface Props {
  storagePath?: string | null;
  photosJson?: any[];
  size?: number;
  blurred?: boolean;
  borderRadius?: number;
  fill?: boolean;
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE}/uploads${path}`;
}

export function ProfilePhoto({ storagePath, photosJson, size, blurred, borderRadius: br, fill }: Props) {
  const firstPhoto = storagePath
    || (photosJson && photosJson.length > 0 && typeof photosJson[0] === 'string' ? photosJson[0] : null);

  const photoUrl = firstPhoto ? buildUrl(firstPhoto) : null;

  const containerStyle: ViewStyle = fill
    ? { ...StyleSheet.absoluteFillObject, borderRadius: br }
    : { width: size || 50, height: size || 50, borderRadius: br ?? (size ? size / 2 : 25) };

  const imageStyle: ImageStyle = fill
    ? { ...StyleSheet.absoluteFillObject, borderRadius: br }
    : { width: size || 50, height: size || 50, borderRadius: br ?? (size ? size / 2 : 25) };

  if (!photoUrl) {
    return (
      <View style={[styles.placeholder, containerStyle]}>
        <Ionicons name="person" size={(size || 50) * 0.4} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl }}
      style={[imageStyle, blurred && styles.blurred]}
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
