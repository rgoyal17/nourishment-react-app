import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Colors, useTheme } from "@rneui/themed";
import { getAuth, signOut } from "firebase/auth";
import { useAuthContext } from "../../../contexts/AuthContext";

export function AccountTab() {
  const { user } = useAuthContext();
  const auth = getAuth();
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>

      <Button title="Sign Out" buttonStyle={styles.button} onPress={() => signOut(auth)} />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    button: {
      marginTop: 10,
      width: 200,
      borderRadius: 10,
    },
  });
