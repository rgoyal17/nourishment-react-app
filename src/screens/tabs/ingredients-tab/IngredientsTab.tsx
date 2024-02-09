import { Colors } from "@rneui/base";
import { useTheme } from "@rneui/themed";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function IngredientsTab() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  return (
    <View style={styles.container}>
      <Text>Coming soon!</Text>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 20,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
