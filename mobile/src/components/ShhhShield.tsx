import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface Props {
  verificationStatus: string;
  size?: number;
}

export function ShhhShield({ verificationStatus, size = 16 }: Props) {
  if (verificationStatus === 'unverified') return null;

  let icon: string;
  let color: string;

  switch (verificationStatus) {
    case 'reference_verified':
      icon = 'shield-checkmark';
      color = colors.success;
      break;
    case 'id_verified':
      icon = 'shield-half';
      color = colors.verified;
      break;
    case 'photo_verified':
      icon = 'shield-outline';
      color = colors.info;
      break;
    default:
      return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    padding: 2,
  },
});
