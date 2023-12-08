import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import "./src/config/firebase";
import React from "react";
import { RootNavigation } from "./src/navigation/RootNavigation";
import { ThemeProvider, createTheme } from "@rneui/themed";
import { Provider } from "react-redux";
import { store } from "./src/redux/store";

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
        <RootNavigation />
      </ThemeProvider>
    </Provider>
  );
}
