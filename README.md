# Zen kAI

This repo contains the experimental ZenAI app with a gamified scoring system inspired by Duolingo. The core features are:

| Feature | Icon |
| --- | --- |
| MindScore | ![MindScore](assets/icons/brain.svg) |
| Level Progress | ![Momentum](assets/icons/bolt.svg) |
| Score Circle | ![Level](assets/icons/level.svg) |
| XP Levels | ![Level](assets/icons/level.svg) |

The `utils/scoring.js` file implements the logic for updating the user's scores and progress. Screens use these icons to create a playful, video game feel without copying Duolingo's colors.

## Testing

Run `npm test` to verify the project setup. This placeholder script simply prints `No tests`.

## Build Profiles

The project uses [EAS Build](https://docs.expo.dev/build/introduction/) profiles to control environment-specific behavior. Each profile sets an `ENV` variable that can be read in the code with `process.env.ENV`:

- `development` – includes debug tools and experimental features.
- `preview` – internal QA build with moderate logging.
- `production` – optimized for real users.

Use `eas build --profile <name>` to create the desired version.
