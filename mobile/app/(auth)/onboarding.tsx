import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, useWindowDimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/theme';

const SLIDES = [
  {
    icon: 'radio-outline',
    title: 'You\'re a Signal',
    subtitle: 'Not a Profile',
    body: 'Shhh shows who\'s nearby and open right now. No algorithms, no matching — just proximity and intention. Your presence decays automatically.',
    accent: colors.primaryLight,
  },
  {
    icon: 'eye-off-outline',
    title: 'Your Photos,\nYour Rules',
    subtitle: 'Blur Until You\'re Ready',
    body: 'Choose to blur your photos. Reveal them only to people you trust, with a timer that auto-revokes. You control who sees what and for how long.',
    accent: colors.info,
  },
  {
    icon: 'timer-outline',
    title: 'Everything\nExpires',
    subtitle: 'Ephemeral by Design',
    body: 'Chats are sessions with a countdown. Media self-destructs. Your presence fades. Nothing lingers unless you deliberately save it.',
    accent: colors.warning,
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'You\'re Always\nin Control',
    subtitle: 'Safety Built In',
    body: 'Switch personas. Set intent signals. Panic wipe all data instantly. Shake your phone 5 times for a silent emergency alert. Shhh is built to disappear when you need it to.',
    accent: colors.success,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(auth)/onboarding-intent');
    }
  };

  const handleSkip = () => router.replace('/(auth)/onboarding-intent');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Skip intro">
        <Text style={styles.skipText}>Skip intro</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => i.toString()}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { shadowColor: item.accent }]}>
              <Ionicons name={item.icon as any} size={48} color={item.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: item.accent }]}>{item.subtitle}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i && styles.dotActive,
                i < currentIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextText}>{currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skipBtn: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: spacing.sm },
  skipText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.borderGlow,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
    ...shadows.glow,
  },
  title: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text, textAlign: 'center', lineHeight: 36 },
  subtitle: { fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.lg },
  body: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, maxWidth: 320 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: 50, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceLight },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotDone: { backgroundColor: colors.primaryMuted },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: 18, borderRadius: borderRadius.lg,
    ...shadows.glow,
  },
  nextText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
});
