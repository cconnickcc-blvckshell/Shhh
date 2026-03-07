import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuthToken, API_BASE, getMediaUrl } from '../api/client';

interface UploadResult {
  id: string;
  url: string;
  /** Storage path for photosJson (e.g. /photos/abc.jpg). Use this when saving to profile. */
  storagePath: string | null;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
}

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickAndUpload = async (
    category: 'photos' | 'albums' | 'messages' = 'photos',
    options?: { selfDestruct?: boolean; ttlSeconds?: number }
  ): Promise<UploadResult | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant photo library access to upload photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return uploadFile(asset.uri, asset.fileName || 'photo.jpg', asset.mimeType || 'image/jpeg', category, options);
  };

  const takePhotoAndUpload = async (
    category: 'photos' | 'albums' | 'messages' = 'photos'
  ): Promise<UploadResult | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return uploadFile(asset.uri, 'camera_photo.jpg', 'image/jpeg', category);
  };

  const uploadFile = async (
    uri: string,
    filename: string,
    mimeType: string,
    category: string,
    options?: { selfDestruct?: boolean; ttlSeconds?: number }
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', { uri, name: filename, type: mimeType } as any);
      }

      formData.append('category', category);
      if (options?.ttlSeconds) {
        formData.append('expiresInSeconds', options.ttlSeconds.toString());
      }

      const endpoint = options?.selfDestruct
        ? '/v1/media/upload/self-destruct'
        : '/v1/media/upload';

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formData,
      });

      setProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Upload failed');
      }

      const json = await res.json();
      const data = json.data;
      const storagePath = data?.url || data?.storage_path;
      return {
        ...data,
        url: storagePath ? getMediaUrl(storagePath) : data?.url,
        storagePath: storagePath || null,
      };
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { pickAndUpload, takePhotoAndUpload, uploading, progress };
}
