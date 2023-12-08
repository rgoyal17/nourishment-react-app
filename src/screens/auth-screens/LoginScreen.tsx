import React from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { Button, Colors, Input, useTheme } from "@rneui/themed";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { SocialIcon } from "@rneui/base";

interface LoginState {
  email: string;
  password: string;
  error: string;
}

const INITIAL_LOGIN_STATE: LoginState = {
  email: "",
  password: "",
  error: "",
};

export function LoginScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const auth = getAuth();

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

  async function signIn() {
    if (loginState.email.trim().length === 0 || loginState.password.trim().length === 0) {
      setLoginState({
        error: "Email and password are mandatory.",
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginState.email, loginState.password);
    } catch (error: any) {
      setLoginState({
        error: error.message,
      });
    }
  }

  async function signUp() {
    if (loginState.email === "" || loginState.password === "") {
      setLoginState({
        error: "Email and password are mandatory.",
      });
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, loginState.email, loginState.password);
    } catch (error: any) {
      setLoginState({
        error: error.message,
      });
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/background.png")}
        resizeMode="cover"
        style={styles.image}
      >
        <View style={styles.content}>
          <Text style={styles.header}>NourishMent</Text>
          <Input
            placeholder="Email"
            onChangeText={(text) => setLoginState({ email: text })}
            value={loginState.email}
            inputContainerStyle={styles.input}
          />
          <Input
            placeholder="Password"
            value={loginState.password}
            onChangeText={(text) => setLoginState({ password: text })}
            secureTextEntry={true}
            inputContainerStyle={styles.input}
          />
          {loginState.error !== "" ? <Text style={styles.error}>{loginState.error}</Text> : null}
          <View style={styles.buttons}>
            <Button title="Sign in" buttonStyle={styles.button} onPress={signIn} />
            <Button title="Sign up" buttonStyle={styles.button} onPress={signUp} />
          </View>
          <SocialIcon
            type="google"
            button
            title="Sign in with Google"
            raised={false}
            style={styles.googleButton}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    image: {
      flex: 1,
    },

    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    header: {
      fontSize: 40,
      color: colors.primary,
      marginBottom: 20,
    },

    input: {
      backgroundColor: colors.white,
      borderBottomWidth: 0,
      borderRadius: 10,
      width: 256,
      alignSelf: "center",
      padding: 10,
      height: 32,
    },

    error: {
      color: "red",
    },

    buttons: {
      display: "flex",
      flexDirection: "row",
      columnGap: 10,
    },

    button: {
      marginTop: 10,
      borderRadius: 10,
    },

    googleButton: {
      width: 200,
      marginTop: 20,
      backgroundColor: colors.primary,
    },
  });
