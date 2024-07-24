import React from "react";
import { ImageBackground, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Colors, Icon, Input, useTheme } from "@rneui/themed";
import { Input as BaseInput } from "@rneui/base";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useAuthContext } from "../../contexts/AuthContext";
import * as AppleAuthentication from "expo-apple-authentication";

interface LoginState {
  email: string;
  password: string;
  confirmPassword: string;
  error: string;
  loading: boolean;
}

const INITIAL_LOGIN_STATE: LoginState = {
  email: "",
  password: "",
  confirmPassword: "",
  error: "",
  loading: false,
};

export function LoginScreen() {
  const { theme } = useTheme();
  const { primary, grey3 } = theme.colors;
  const styles = makeStyles(theme.colors);
  const auth = getAuth();
  const { isSettingUpUser } = useAuthContext();

  const [selectedTab, setSelectedTab] = React.useState(0);

  const [loginState, setLoginState] = React.useReducer(
    (prev: LoginState, next: Partial<LoginState>) => {
      const nextState = { ...prev, ...next };
      if (next.error == null && next.loading == null) {
        // reset the error if email, password, or confirm password change.
        nextState.error = "";
      }
      return nextState;
    },
    INITIAL_LOGIN_STATE,
  );

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const passwordRef = React.createRef<BaseInput & TextInput>();
  const confirmPasswordRef = React.useRef<BaseInput & TextInput>(null);

  React.useEffect(() => {
    GoogleSignin.configure({ webClientId: Constants.expoConfig?.extra?.webClientId });
  }, []);

  const googleSignIn = React.useCallback(async () => {
    try {
      setLoginState({ loading: true, error: "" });
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
          case statusCodes.SIGN_IN_CANCELLED:
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setLoginState({ error: "Google play services not available" });
            return;
        }
      } else {
        Sentry.captureException(error);
        setLoginState({ error: "Failed to sign in" });
      }
    } finally {
      setLoginState({ loading: false });
    }
  }, [auth]);

  const handleChangeTab = (tabId: number) => () => {
    setLoginState({ error: "" });
    setSelectedTab(tabId);
  };

  const signIn = React.useCallback(async () => {
    if (loginState.email.trim().length === 0 || loginState.password.trim().length === 0) {
      setLoginState({
        error: "Email and password are mandatory",
      });
      return;
    }

    try {
      setLoginState({ loading: true });
      await signInWithEmailAndPassword(auth, loginState.email, loginState.password);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setLoginState({ error: "Email address doesn't exist, please sign up first" });
      } else if (error.code === "auth/wrong-password") {
        setLoginState({ error: "Incorrect password" });
      } else if (error.code === "auth/invalid-email") {
        setLoginState({ error: "Invalid email address" });
      } else {
        Sentry.captureException(error);
        setLoginState({ error: "Failed to sign in" });
      }
    } finally {
      setLoginState({ loading: false });
    }
  }, [auth, loginState.email, loginState.password]);

  const signUp = React.useCallback(async () => {
    const { email, password, confirmPassword } = loginState;
    if (email.trim().length === 0 || password.trim().length === 0) {
      setLoginState({ error: "Email and password are mandatory" });
      return;
    }

    if (password !== confirmPassword) {
      setLoginState({
        error: "Passwords do not match",
      });
      return;
    }

    try {
      setLoginState({ loading: true });
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === "auth/invalid-email") {
        setLoginState({ error: "Invalid email address" });
      } else if (error.code === "auth/weak-password") {
        setLoginState({ error: "Password too weak" });
      } else if (error.code === "auth/email-already-in-use") {
        setLoginState({ error: "Email address already exists, please sign in" });
      } else {
        Sentry.captureException(error);
        setLoginState({ error: "Failed to sign up" });
      }
    } finally {
      setLoginState({ loading: false });
    }
  }, [auth, loginState]);

  const handlePasswordDone = React.useCallback(() => {
    if (selectedTab === 0) {
      signIn();
    } else {
      confirmPasswordRef.current?.focus();
    }
  }, [selectedTab, signIn]);

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
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Input
              placeholder="Password"
              value={loginState.password}
              onChangeText={(text) => setLoginState({ password: text })}
              secureTextEntry={!showPassword}
              inputContainerStyle={styles.input}
              containerStyle={styles.inputContainer}
              returnKeyType={selectedTab === 0 ? "done" : "next"}
              ref={passwordRef}
              rightIcon={
                showPassword ? (
                  <Icon name="eye-with-line" type="entypo" onPress={() => setShowPassword(false)} />
                ) : (
                  <Icon name="eye" type="entypo" onPress={() => setShowPassword(true)} />
                )
              }
              onSubmitEditing={handlePasswordDone}
            />
            {selectedTab === 1 ? (
              <Input
                placeholder="Confirm password"
                value={loginState.confirmPassword}
                onChangeText={(text) => setLoginState({ confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
                inputContainerStyle={styles.input}
                containerStyle={styles.inputContainer}
                returnKeyType="done"
                rightIcon={
                  showConfirmPassword ? (
                    <Icon
                      name="eye-with-line"
                      type="entypo"
                      onPress={() => setShowConfirmPassword(false)}
                    />
                  ) : (
                    <Icon name="eye" type="entypo" onPress={() => setShowConfirmPassword(true)} />
                  )
                }
                ref={confirmPasswordRef}
                onSubmitEditing={signUp}
              />
            ) : null}
            {loginState.error !== "" ? <Text style={styles.error}>{loginState.error}</Text> : null}
            {selectedTab === 0 ? (
              <Button
                title="Sign in"
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
                loading={loginState.loading || isSettingUpUser}
                onPress={signIn}
              />
            ) : (
              <Button
                title="Sign up"
                containerStyle={styles.buttonContainer}
                buttonStyle={styles.button}
                loading={loginState.loading || isSettingUpUser}
                onPress={signUp}
              />
            )}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={{ color: grey3 }}>or connect with</Text>
              <View style={styles.divider} />
            </View>
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={googleSignIn}
              style={styles.googleButton}
              disabled={loginState.loading || isSettingUpUser}
            />
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={5}
              onPress={async () => {
                try {
                  const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                      AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                  });
                  // signed in
                } catch (e: any) {
                  if (e.code === "ERR_REQUEST_CANCELED") {
                    // handle that the user canceled the sign-in flow
                  } else {
                    // handle other errors
                  }
                }
              }}
            />
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
      marginTop: 200,
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
      textShadowColor: colors.primary,
      textShadowRadius: 2,
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
      marginBottom: 5,
    },

    button: {
      borderRadius: 15,
    },

    buttonContainer: {
      width: "100%",
    },

    dividerContainer: {
      flexDirection: "row",
      columnGap: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },

    divider: {
      width: 100,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.grey3,
    },

    googleButton: {
      marginTop: 20,
    },
  });
