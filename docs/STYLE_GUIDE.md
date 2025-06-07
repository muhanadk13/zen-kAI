# ZenAI UI Style Guide

This document outlines the core design system for the ZenAI application. It draws inspiration from Duolingo's playful interface while adopting a unique purple–blue gradient identity.

## Dark Mode Foundation

- **Background:** `#0F172A`
- **Card Surfaces:** `#1E293B` or `#1C1C2E`
- **Accent Surfaces:** `#202B43`

## Color Palette

| Purpose | Value | Notes |
| --- | --- | --- |
| **Primary Gradient** | `#8324E6 → #FF61F6` | Main calls to action |
| **Accent Gradient** | `#00D1FF → #2F80ED` | XP, streaks, highlights |
| **Danger / Error** | `#FF4B4B` | Hearts and errors |
| **Success** | `#10B981` | Positive actions |
| **XP Yellow** | `#FFD700` | XP points and rewards |
| **Streak Flame** | `#FF6D00` | Streak icons |
| **Freeze Blue** | `#60A5FA` | Streak freezes |
| **Muted Text** | `#94A3B8` | Labels and descriptions |
| **White Text** | `#F8FAFC` | Headlines |

## Typography

| Role | Font | Weight | Size |
| --- | --- | --- | --- |
| Headlines | Fredoka / Baloo 2 | Bold | 24–32 |
| Subheaders | Nunito | SemiBold | 18–22 |
| Body | Inter | Regular | 14–16 |
| Buttons | Nunito | Bold | 16–20 |

Apply `letterSpacing: 0.5` and `lineHeight: 1.4 × fontSize`.

## Buttons

Primary buttons use the purple gradient, secondary actions use the blue gradient. Use subtle shadows and a rounded 100px radius. Apply a quick scale animation on tap.

## Cards

Cards sit on dark surfaces with rounded corners and small shadows:

```js
{
  backgroundColor: '#1E293B',
  borderRadius: 20,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 4,
}
```

## Navigation

The bottom navigation bar has a dark background (`#0F172A`). Highlight the active tab with a blue glow and small bounce animation.

## Gamification Elements

- **Hearts:** `#FF4B4B`
- **XP Text:** `#FFD700`
- **Streak Flames:** `#FF6D00`
- **Rewards:** use gold `#FACC15` or ice `#60A5FA`

## Micro‑Animations

Use `react-native-reanimated` or `Moti` for delightful touches such as button presses, streak gain pulses, and chest openings.

