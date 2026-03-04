import { useState } from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getMediaUrl, getThumbnailUrl } from '../api/client';

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
  /** When true and size < 200, use thumbnail URL for grid (better quality per FRONTEND_GAP §4). */
  preferThumbnail?: boolean;
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return getMediaUrl(path.startsWith('/') ? path : `/${path}`);
}

export function ProfilePhoto({ storagePath, photosJson, size, blurred, canSeeUnblurred, borderRadius: br, fill, preferThumbnail }: Props) {
  const firstPhoto = storagePath
    || (photosJson && photosJson.length > 0 && typeof photosJson[0] === 'string' ? photosJson[0] : null);

  const useThumb = preferThumbnail && (size ?? 0) < 200 && firstPhoto;
  const thumbUrl = useThumb ? getThumbnailUrl(firstPhoto) : null;
  const fullUrl = firstPhoto ? buildUrl(firstPhoto) : null;
  const [thumbFailed, setThumbFailed] = useState(false);
  const photoUrl = (useThumb && thumbUrl && !thumbFailed) ? thumbUrl : fullUrl;

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
      source={{ uri: photoUrl ?? undefined }}
      style={[imageStyle, shouldBlur && styles.blurred]}
      resizeMode="cover"
      onError={() => {
        if (useThumb && thumbUrl && photoUrl === thumbUrl) setThumbFailed(true);
      }}
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
