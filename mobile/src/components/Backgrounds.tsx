import React from 'react';
import { View, ImageBackground, Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const images = {
  galaxy: require('../../assets/images/purple-galaxy.png'),
  bubble: require('../../assets/images/purple-bubble.jpg'),
  banner: require('../../assets/images/purple-banner.jpg'),
  demonGirl: require('../../assets/images/demon-girl.png'),
  appIcon: require('../../assets/images/app-icon.png'),
} as const;

export { images as backgroundImages };

/** Premium dark gradient — clean, minimal. No loud blobs; subtle edge tint only. */
export function PremiumDarkBackground({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={['#050508', '#08060C', '#06040A', '#050508']}
      locations={[0, 0.3, 0.7, 1]}
      style={[styles.full, style]}
    >
      <View style={styles.subtleGlow} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

/** Auth screens (login/register): same palette with stronger plum center. */
export function AuthScreenBackground({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={['#06040A', '#0D0818', '#0B0712', '#06040A']}
      locations={[0, 0.4, 0.75, 1]}
      style={[styles.full, style]}
    >
      <View style={styles.authGlow} />
      {children}
    </LinearGradient>
  );
}

/** Full-screen purple galaxy background; content goes on top. */
export function GalaxyBackground({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground source={images.galaxy} style={[styles.full, style]} resizeMode="cover">
      <View style={styles.galaxyOverlay} />
      {children}
    </ImageBackground>
  );
}

/** Full-screen purple bubble background — use as the screen background behind forms. Content sits on top. */
export function BubbleScreenBackground({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground source={images.bubble} style={[styles.full, style]} resizeMode="cover">
      <View style={styles.bubbleScreenOverlay} />
      {children}
    </ImageBackground>
  );
}

/** Small wrapper with bubble texture (e.g. a card). Use sparingly; prefer BubbleScreenBackground for form screens. */
export function BubbleWrapper({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground source={images.bubble} style={[styles.wrapper, style]} resizeMode="cover">
      <View style={styles.bubbleOverlay} />
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </ImageBackground>
  );
}

/** Banner strip (e.g. event card header). */
export function BannerImage({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground source={images.banner} style={[styles.banner, style]} resizeMode="cover">
      {children}
    </ImageBackground>
  );
}

/** Semi-transparent demon girl for login screen. */
export function DemonGirlLoginBg({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.full, style]}>
      <ImageBackground source={images.demonGirl} style={styles.demonLayer} resizeMode="cover" imageStyle={styles.demonImageOpacity} />
      <View style={styles.demonOverlay} />
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </View>
  );
}

/** App icon in a rounded-square shape (for square neon frame on login, etc.). */
export function AppIconImage({ size = 72 }: { size?: number }) {
  const cornerRadius = Math.round(size * 0.2);
  return (
    <Image source={images.appIcon} style={{ width: size, height: size, borderRadius: cornerRadius }} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  authGlow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(124,43,255,0.12)',
  },
  subtleGlow: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(124,43,255,0.04)',
  },
  galaxyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,4,10,0.35)' },
  bubbleScreenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,4,10,0.45)' },
  wrapper: { overflow: 'hidden', borderRadius: 18 },
  bubbleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,7,18,0.6)' },
  banner: { minHeight: 50, justifyContent: 'center', alignItems: 'center' },
  demonLayer: { ...StyleSheet.absoluteFillObject },
  demonImageOpacity: { opacity: 0.2 },
  demonOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,4,10,0.5)' },
});
