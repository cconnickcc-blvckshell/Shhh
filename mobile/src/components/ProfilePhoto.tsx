import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getMediaUrl } from '../api/client';

interface Props {
  storagePath?: string | null;
  photosJson?: any[];
  size?: number;
  /** @deprecated Prefer canSeeUnblurred from GET /v1/photos/check/:userId */
  blurred?: boolean;
  /** When true show photo; when false blur. Default false when unknown (never expose). */
  canSeeUnblurred?: boolean | null;
  borderRadius?: number;
  fill?: boolean;
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return getMediaUrl(path.startsWith('/') ? path : `/${path}`);
}

export function ProfilePhoto({ storagePath, photosJson, size, blurred, canSeeUnblurred, borderRadius: br, fill }: Props) {
  const firstPhoto = storagePath
    || (photosJson && photosJson.length > 0 && typeof photosJson[0] === 'string' ? photosJson[0] : null);

  const photoUrl = firstPhoto ? buildUrl(firstPhoto) : null;

  const containerStyle: ViewStyle = fill
    ? { ...StyleSheet.absoluteFillObject, borderRadius: br }
    : { width: size || 50, height: size || 50, borderRadius: br ?? (size ? size / 2 : 25) };

  const imageStyle: ImageStyle = fill
    ? { ...StyleSheet.absoluteFillObject, borderRadius: br }
    : { width: size || 50, height: size || 50, borderRadius: br ?? (size ? size / 2 : 25) };

  const shouldBlur =
    canSeeUnblurred !== undefined ? (canSeeUnblurred !== true) : !!blurred;

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
      style={[imageStyle, shouldBlur && styles.blurred]}
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
