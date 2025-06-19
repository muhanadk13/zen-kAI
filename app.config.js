import 'dotenv/config';

export default {
  expo: {
    name: "zen-kAI",
    slug: "zen-kai",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon-japan.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon-japan.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.zenkai.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.zenkai.app",
      edgeToEdgeEnabled: true,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.INTERNET"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "ed9f9ba9-1009-47ba-9f6c-32982d3efe45"
      },
      env: process.env.ENV
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon-japan.png",
          color: "#ffffff"
        }
      ]
    ],
    scheme: "zen-kai"
  }
};
