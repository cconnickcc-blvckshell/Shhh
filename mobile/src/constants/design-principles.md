# Shhh Mobile — Design Principles

UI/UX should feel like a **million-dollar product**: premium, intentional, and cohesive—not "bedroom-coded."

## Visual

- **Palette**: Use `theme.ts` only. Deep blacks with purple undertone (`#050508`, `#0E0B16`), primary purple (`#9333EA`), accent and status colors. No one-off hex codes.
- **Typography**: Clear hierarchy. Labels: small caps, letter-spacing, muted. Headlines: weight 700–900, tight letter-spacing. Body: readable line-height (1.4–1.5).
- **Space**: Use `spacing` tokens. Generous padding on key screens; avoid cramped rows. Card and section spacing should feel intentional.
- **Motion**: Subtle only. Use Reanimated for any animation (splash glow, list feedback). No janky or gratuitous motion.
- **Shadows & depth**: Use `shadows.glow` for primary CTAs and cards that need lift. Border glow (`borderGlow`) for focus states.

## Interaction

- **Touch targets**: Minimum 44pt. Buttons and list rows sized for thumb use.
- **Feedback**: Haptics on meaningful actions (like, whisper, RSVP). Loading states on every async action (skeleton or spinner, never a dead tap).
- **Errors**: Inline or alert with calm, actionable copy. No raw "Error 500" or technical jargon.

## Consistency

- **Screens**: Same structure where possible—hero/header, scroll body, sticky actions or tab bar. Align with existing Explore, Profile, and Auth screens.
- **Components**: Reuse `ProfilePhoto`, theme, and shared patterns. New components should feel like they belong.
- **Copy**: Calm, adult, matter-of-fact (see UX_BEHAVIOR_SPEC). No hype or teen slang.

## Quality bar

Before shipping a screen: Would this pass for a top-tier dating or social app? If it feels placeholder or generic, tighten spacing, hierarchy, and feedback until it doesn’t.
