# Zen kAI

This repo contains the experimental ZenAI app with a gamified scoring system inspired by Duolingo. The core features are:

| Feature | Icon |
| --- | --- |
| MindScore | ![MindScore](assets/icons/brain.svg) |
| Level Progress | ![Momentum](assets/icons/bolt.svg) |
| Score Circle | ![Level](assets/icons/level.svg) |
| XP Levels | ![Level](assets/icons/level.svg) |

The `utils/scoring.js` file implements the logic for updating the user's scores and progress. Screens use these icons to create a playful, video game feel without copying Duolingo's colors.
Level ups trigger a burst of confetti for extra celebration. The latest update introduces a dark theme and looping streak animation for a more immersive experience.

## Testing

Run `npm test` to verify the project setup. This placeholder script simply prints `No tests`.
