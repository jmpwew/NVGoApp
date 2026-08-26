export default ({ config }) => ({
  expo: {
    name: "NVGo",
    slug: "nvgo",
    owner: "jmpwew",
    version: "1.0.0",
    scheme: "nvgo",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F5C400"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: "./google-services.json",
      package: "com.nvgo.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        { color: "#0B7A75" }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "NVGo uses your location to show local weather updates and help responders locate you faster when you submit an emergency report."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "c4e07936-f152-4af8-9b6b-d179b12205ab"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.8:5000"
    }
  }
});