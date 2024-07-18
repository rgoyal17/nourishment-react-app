import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button, Colors, useTheme } from "@rneui/themed";
import { getAuth, signOut } from "firebase/auth";
import { useAuthContext } from "../../../contexts/AuthContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Sentry from "@sentry/react-native";

export function AccountTab() {
  const { user } = useAuthContext();
  const auth = getAuth();
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const logOut = React.useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      signOut(auth);
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to sign out");
    }
  }, [auth]);

  return (
    <View style={styles.container}>
      <Text>Welcome {user?.email}!</Text>

      <Button title="Sign Out" buttonStyle={styles.button} onPress={logOut} />
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
