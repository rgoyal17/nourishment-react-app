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
