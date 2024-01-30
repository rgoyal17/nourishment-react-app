import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Button, Colors, Input, useTheme } from "@rneui/themed";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Sentry from "@sentry/react-native";
// import { SocialIcon } from "@rneui/base";

interface LoginState {
  email: string;
  password: string;
  confirmPassword: string;
  error: string;
}

const INITIAL_LOGIN_STATE: LoginState = {
  email: "",
  password: "",
  confirmPassword: "",
  error: "",
};

export function LoginScreen() {
  const { theme } = useTheme();
  const { primary } = theme.colors;
  const styles = makeStyles(theme.colors);
  const auth = getAuth();

  const [selectedTab, setSelectedTab] = React.useState(0);

  const [loginState, setLoginState] = React.useReducer(
    (prev: LoginState, next: Partial<LoginState>) => {
      const nextState = { ...prev, ...next };
      if (next.error == null) {
        nextState.error = "";
      }
      return nextState;
    },
    INITIAL_LOGIN_STATE,
  );

  const handleChangeTab = (tabId: number) => () => {
    setLoginState({ error: "" });
    setSelectedTab(tabId);
  };

  async function signIn() {
    if (loginState.email.trim().length === 0 || loginState.password.trim().length === 0) {
      setLoginState({
        error: "Email and password are mandatory",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginState.email, loginState.password);
    } catch (error: any) {
      let errorMessage = "Failed to sign in";
      if (error.code === "auth/user-not-found") {
        errorMessage = "Email address doesn't exist";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }
      Sentry.captureException(error);
      setLoginState({ error: errorMessage });
    }
  }

  async function signUp() {
    if (loginState.email.trim().length === 0 || loginState.password.trim().length === 0) {
      setLoginState({
        error: "Email and password are mandatory",
      });
      return;
    }

    if (loginState.password !== loginState.confirmPassword) {
      setLoginState({
        error: "Passwords do not match",
      });
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, loginState.email, loginState.password);
    } catch (error: any) {
      let errorMessage = "Failed to sign up";
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password too weak";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email address already exists, please sign in";
      }
      Sentry.captureException(error);
      setLoginState({ error: errorMessage });
    }
  }

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <View style={styles.container}>
        <ImageBackground
          source={require("../../../assets/background.png")}
          resizeMode="cover"
          style={styles.image}
        >
          <View style={styles.content}>
            <Text style={styles.header}>NourishMent</Text>
            <View style={styles.tabButtons}>
              <Button
                containerStyle={styles.tabButton}
                onPress={handleChangeTab(0)}
                color={selectedTab === 0 ? theme.colors.secondary : theme.colors.white}
                title="Sign In"
                titleStyle={{ color: primary }}
              />
              <Button
                containerStyle={styles.tabButton}
                onPress={handleChangeTab(1)}
                color={selectedTab === 1 ? theme.colors.secondary : theme.colors.white}
                title="Sign Up"
                titleStyle={{ color: primary }}
              />
            </View>
            <Input
              placeholder="Email"
              onChangeText={(text) => setLoginState({ email: text })}
              value={loginState.email}
              inputContainerStyle={styles.input}
              containerStyle={styles.inputContainer}
              returnKeyType="done"
            />
            <Input
              placeholder="Password"
              value={loginState.password}
              onChangeText={(text) => setLoginState({ password: text })}
              secureTextEntry={true}
              inputContainerStyle={styles.input}
              containerStyle={styles.inputContainer}
              returnKeyType="done"
            />
            {selectedTab === 1 ? (
              <Input
                placeholder="Confirm password"
                value={loginState.confirmPassword}
                onChangeText={(text) => setLoginState({ confirmPassword: text })}
                secureTextEntry={true}
                inputContainerStyle={styles.input}
                containerStyle={styles.inputContainer}
                returnKeyType="done"
              />
            ) : null}
            {loginState.error !== "" ? <Text style={styles.error}>{loginState.error}</Text> : null}
            {selectedTab === 0 ? (
              <Button
                title="Sign in"
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
                onPress={signIn}
              />
            ) : (
              <Button
                title="Sign up"
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
                onPress={signUp}
              />
            )}
            {/* <SocialIcon
              type="google"
              button
              title="Sign in with Google"
              raised={false}
              style={styles.googleButton}
            /> */}
          </View>
        </ImageBackground>
      </View>
    </KeyboardAwareScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },

    image: {
      flex: 1,
    },

    content: {
      flex: 1,
      marginTop: 250,
      padding: 40,
      alignItems: "center",
    },

    tabButtons: {
      display: "flex",
      flexDirection: "row",
      padding: 5,
      marginBottom: 30,
      backgroundColor: colors.white,
      borderRadius: 15,
    },

    tabButton: {
      flex: 1,
      borderRadius: 15,
    },

    header: {
      fontSize: 40,
      color: colors.primary,
      marginBottom: 20,
      fontWeight: "500",
    },

    input: {
      backgroundColor: colors.white,
      borderBottomWidth: 0,
      borderRadius: 15,
      alignSelf: "center",
      padding: 10,
      height: 35,
    },

    inputContainer: {
      paddingHorizontal: 0,
    },

    error: {
      color: colors.error,
    },

    button: {
      marginTop: 10,
      borderRadius: 15,
    },

    buttonContainer: {
      width: "100%",
    },

    googleButton: {
      width: 200,
      marginTop: 20,
      backgroundColor: colors.primary,
    },
  });
