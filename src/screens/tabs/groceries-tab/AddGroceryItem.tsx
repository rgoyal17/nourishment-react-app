import React from "react";
import { Colors, useTheme } from "@rneui/themed";
import { View, StyleSheet } from "react-native";

export function AddGroceryItem() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  return <View style={styles.container} />;
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
  });
