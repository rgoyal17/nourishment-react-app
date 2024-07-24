import "dotenv/config";

export default {
  expo: {
    name: "NourishMent",
    slug: "nourishment",
    version: "1.2.9",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rgoyal.nourishment",
      buildNumber: "30",
      googleServicesFile: process.env.GOOGLE_SERVICES_INFOPLIST,
      usesAppleSignIn: true,
    },
    android: {
      package: "com.rgoyal.nourishment",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      adaptiveIcon: {
        foregroundImage: "./assets/background.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "sentry-expo",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
    ],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,

      openAiKey: process.env.OPEN_AI_KEY,

      iosClientId: process.env.IOS_CLIENT_ID,
      androidClientId: process.env.ANDROID_CLIENT_ID,
      webClientId: process.env.WEB_CLIENT_ID,

      eas: {
        projectId: "4c4f8aa6-6d7a-44a7-833e-d5fc6f60dcbf",
      },
    },
    scheme: "nourishment",
  },
};
