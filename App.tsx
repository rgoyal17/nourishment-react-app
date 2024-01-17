import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import "./src/config/firebase";
import React from "react";
import { RootNavigation } from "./src/navigation/RootNavigation";
import { ThemeProvider, createTheme } from "@rneui/themed";
import { Provider } from "react-redux";
import { store } from "./src/redux/store";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://8ee5743505d3d27efcf6670609f4b97c@o4506578882396160.ingest.sentry.io/4506584065835008",
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
});

export default function App() {
  const theme = createTheme({
    lightColors: {
      primary: "#3DAC78",
      secondary: "#D8F3DC",
    },
  });

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <RootNavigation />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </Provider>
  );
}
