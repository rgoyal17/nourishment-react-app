import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as React from "react";
import { Button, Colors, Icon, Image, useTheme } from "@rneui/themed";
import { useAuthContext } from "../../../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  fetchUserProfile,
  selectUserProfileState,
  updateUserProfile,
} from "../../../redux/userProfileSlice";
import * as Sentry from "@sentry/react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { uploadImageToFirebase } from "../../../common/uploadImageToFirebase";

interface EmailState {
  email: string;
  loading: boolean;
  error?: string;
}

const INITIAL_EMAIL_STATE: EmailState = { email: "", loading: false };

interface NameState {
  name: string;
  loading: boolean;
  error?: string;
}

const INITIAL_NAME_STATE: NameState = { name: "", loading: false };

interface PasswordState {
  existingPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  loading: boolean;
  error?: string;
}

const INITIAL_PASSWORD_STATE: PasswordState = {
  existingPassword: "",
  newPassword: "",
  confirmNewPassword: "",
  loading: false,
};

export function EditAccountPage() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();
  const { userProfile } = useAppSelector(selectUserProfileState);
  const [isPhotoLoading, setIsPhotoLoading] = React.useState(false);
  const [emailState, setEmailState] = React.useReducer(
    (prev: EmailState, next: Partial<EmailState>) => {
      const nextState = { ...prev, ...next };
      if (next.email != null) {
        // reset the error if email is being changed.
        nextState.error = undefined;
      }
      return nextState;
    },
    INITIAL_EMAIL_STATE,
  );
  const [nameState, setNameState] = React.useReducer(
    (prev: NameState, next: Partial<NameState>) => {
      const nextState = { ...prev, ...next };
      if (next.name != null) {
        // reset the error if name is being changed.
        nextState.error = undefined;
      }
      return nextState;
    },
    INITIAL_NAME_STATE,
  );
  const [passwordState, setPasswordState] = React.useReducer(
    (prev: PasswordState, next: Partial<PasswordState>) => {
      const nextState = { ...prev, ...next };
      if (next.error == null && next.loading == null) {
        // reset the error if password is being changed.
        nextState.error = undefined;
      }
      return nextState;
    },
    INITIAL_PASSWORD_STATE,
  );

  const emailBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const emailSnapPoints = React.useMemo(() => ["20%", "60%"], []);

  const nameBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const nameSnapPoints = React.useMemo(() => ["20%", "60%"], []);

  const passwordBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const passwordSnapPoints = React.useMemo(() => ["40%", "75%"], []);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchUserProfile(user.uid));
    }
  }, [dispatch, user]);

  const handleEditImage = React.useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && user != null) {
      try {
        setIsPhotoLoading(true);
        const photo = await uploadImageToFirebase(result.assets[0].uri, `${user.uid}/image.jpg`);
        await dispatch(
          updateUserProfile({
            userId: user.uid,
            existingUserProfile: userProfile,
            updatedUserProfile: { photo },
          }),
        );
        await updateProfile(user, { photoURL: photo });
        await dispatch(fetchUserProfile(user.uid));
      } catch (e) {
        Sentry.captureException(e);
        Alert.alert("Failed to update profile");
      } finally {
        setIsPhotoLoading(false);
      }
    }
  }, [dispatch, user, userProfile]);

  const handleEditEmail = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in first");
      return;
    }

    try {
      setEmailState({ loading: true });
      await updateEmail(user, emailState.email);
      await dispatch(
        updateUserProfile({
          userId: user.uid,
          existingUserProfile: userProfile,
          updatedUserProfile: { email: emailState.email },
        }),
      );
      await dispatch(fetchUserProfile(user.uid));
      emailBottomSheetRef.current?.dismiss();
      setEmailState({ email: "" });
    } catch (error: any) {
      if (error.code === "auth/invalid-email") {
        setEmailState({ error: "Invalid email address" });
      } else if (error.code === "auth/requires-recent-login") {
        setEmailState({ error: "Please sign in and try again" });
      } else {
        Sentry.captureException(error);
        setEmailState({ error: "Failed to update email" });
      }
    } finally {
      setEmailState({ loading: false });
    }
  }, [dispatch, emailState.email, user, userProfile]);

  const handleEditName = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in first");
      return;
    }

    try {
      setNameState({ loading: true });
      await updateProfile(user, { displayName: nameState.name });
      await dispatch(
        updateUserProfile({
          userId: user.uid,
          existingUserProfile: userProfile,
          updatedUserProfile: { name: nameState.name },
        }),
      );
      await dispatch(fetchUserProfile(user.uid));
      nameBottomSheetRef.current?.dismiss();
      setNameState({ name: "" });
    } catch (e) {
      Sentry.captureException(e);
      setNameState({ error: "Failed to update name" });
    } finally {
      setNameState({ loading: false });
    }
  }, [dispatch, nameState.name, user, userProfile]);

  const handleUpdatePassword = React.useCallback(async () => {
    if (user?.uid == null || userProfile.email == null) {
      Alert.alert("Please sign in first");
      return;
    }
    try {
      setPasswordState({ loading: true });
      const credential = EmailAuthProvider.credential(
        userProfile.email,
        passwordState.existingPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordState.newPassword);
      await dispatch(fetchUserProfile(user.uid));
      passwordBottomSheetRef.current?.dismiss();
      setPasswordState(INITIAL_PASSWORD_STATE);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setPasswordState({ error: "Incorrect password" });
      } else if (error.code === "auth/weak-password") {
        setPasswordState({ error: "Password too weak" });
      } else {
        setPasswordState({ error: "Failed to update password" });
        Sentry.captureException(error);
      }
    } finally {
      setPasswordState({ loading: false });
    }
  }, [
    dispatch,
    passwordState.existingPassword,
    passwordState.newPassword,
    user,
    userProfile.email,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>Profile Image</Text>
        {userProfile.photo == null ? (
          <Button
            title="Add photo"
            size="sm"
            buttonStyle={styles.addButton}
            onPress={handleEditImage}
            loading={isPhotoLoading}
          />
        ) : (
          <View style={styles.content}>
            {isPhotoLoading ? (
              <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
            ) : (
              <Image
                style={styles.image}
                source={{ uri: userProfile.photo }}
                PlaceholderContent={
                  <ActivityIndicator
                    style={styles.activityIndicator}
                    color={theme.colors.primary}
                  />
                }
              />
            )}
            <TouchableOpacity style={styles.roundButton} onPress={handleEditImage}>
              <Icon name="edit" color={theme.colors.secondary} size={15} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.header}>Email</Text>
        {userProfile.email == null ? (
          <Button
            title="Add email"
            size="sm"
            buttonStyle={styles.addButton}
            onPress={() => emailBottomSheetRef.current?.present()}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.text}>{userProfile.email}</Text>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={() => emailBottomSheetRef.current?.present()}
            >
              <Icon name="edit" color={theme.colors.secondary} size={15} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.header}>Name</Text>
        {userProfile.name == null ? (
          <Button
            title="Add name"
            size="sm"
            buttonStyle={styles.addButton}
            onPress={() => nameBottomSheetRef.current?.present()}
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.text}>{userProfile.name}</Text>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={() => nameBottomSheetRef.current?.present()}
            >
              <Icon name="edit" color={theme.colors.secondary} size={15} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.header}>Password</Text>
        <View style={styles.content}>
          <Text>{"\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF"}</Text>
          <TouchableOpacity
            style={styles.roundButton}
            onPress={() => passwordBottomSheetRef.current?.present()}
          >
            <Icon name="edit" color={theme.colors.secondary} size={15} />
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheetModal
        enablePanDownToClose
        ref={emailBottomSheetRef}
        snapPoints={emailSnapPoints}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.bottomSheet}>
          <View>
            <BottomSheetTextInput
              value={emailState.email}
              placeholder="Enter new email"
              onChangeText={(val) => setEmailState({ email: val })}
              returnKeyType="done"
              onSubmitEditing={handleEditEmail}
            />
            {emailState.error != null ? <Text style={styles.error}>{emailState.error}</Text> : null}
          </View>
          <Button
            title="Update"
            disabled={emailState.email === "" || emailState.email === userProfile.email}
            onPress={handleEditEmail}
            loading={emailState.loading}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        enablePanDownToClose
        ref={nameBottomSheetRef}
        snapPoints={nameSnapPoints}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.bottomSheet}>
          <View>
            <BottomSheetTextInput
              value={nameState.name}
              placeholder="Enter name"
              onChangeText={(val) => setNameState({ name: val })}
              returnKeyType="done"
              onSubmitEditing={handleEditName}
            />
            {nameState.error != null ? <Text style={styles.error}>{nameState.error}</Text> : null}
          </View>
          <Button
            title="Update"
            disabled={nameState.name === "" || nameState.name === userProfile.name}
            onPress={handleEditName}
            loading={nameState.loading}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        enablePanDownToClose
        ref={passwordBottomSheetRef}
        snapPoints={passwordSnapPoints}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.labelInput}>
            <Text style={{ fontWeight: "500" }}>Current password</Text>
            <BottomSheetTextInput
              value={passwordState.existingPassword}
              onChangeText={(val) => setPasswordState({ existingPassword: val })}
              style={styles.passwordInput}
              secureTextEntry={true}
            />
          </View>
          <View style={styles.labelInput}>
            <Text style={{ fontWeight: "500" }}>New password</Text>
            <BottomSheetTextInput
              value={passwordState.newPassword}
              onChangeText={(val) => setPasswordState({ newPassword: val })}
              style={styles.passwordInput}
              secureTextEntry={true}
            />
          </View>
          <View style={styles.labelInput}>
            <Text style={{ fontWeight: "500" }}>Confirm new password</Text>
            <BottomSheetTextInput
              value={passwordState.confirmNewPassword}
              onChangeText={(val) => setPasswordState({ confirmNewPassword: val })}
              style={styles.passwordInput}
              secureTextEntry={true}
            />
            {passwordState.error != null ? (
              <Text style={styles.error}>{passwordState.error}</Text>
            ) : null}
          </View>
          <Button
            title="Update"
            disabled={
              passwordState.existingPassword === "" ||
              passwordState.newPassword === "" ||
              passwordState.confirmNewPassword !== passwordState.newPassword
            }
            onPress={handleUpdatePassword}
            loading={passwordState.loading}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: 15,
      rowGap: 25,
    },
    section: {
      rowGap: 5,
    },
    header: {
      fontSize: 18,
      fontWeight: "500",
    },
    content: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    roundButton: {
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 100,
      backgroundColor: colors.primary,
    },
    image: {
      height: 70,
      width: 70,
      borderRadius: 40,
    },
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 40,
      height: 70,
      width: 70,
    },
    text: {
      fontSize: 15,
    },
    bottomSheet: {
      backgroundColor: colors.white,
      padding: 20,
      display: "flex",
      rowGap: 20,
    },
    error: {
      color: colors.error,
      marginTop: 10,
    },
    addButton: {
      width: 120,
      borderRadius: 10,
    },
    labelInput: {
      rowGap: 7,
    },
    passwordInput: {
      borderBottomWidth: 0.2,
    },
  });
