import React from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { Colors, Icon, IconProps, Image, useTheme } from "@rneui/themed";
import { getAuth, signOut } from "firebase/auth";
import { useAuthContext } from "../../../contexts/AuthContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Sentry from "@sentry/react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { deleteDoc, doc, getFirestore } from "firebase/firestore";
import { StackScreenProps } from "@react-navigation/stack";
import { AccountTabStackParamList } from "./AccountTab";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchUserProfile, selectUserProfileState } from "../../../redux/userProfileSlice";

type AccountPageProps = StackScreenProps<AccountTabStackParamList, "AccountPage">;

export function AccountPage({ navigation }: AccountPageProps) {
  const { user } = useAuthContext();
  const auth = getAuth();
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const dispatch = useAppDispatch();
  const { userProfile } = useAppSelector(selectUserProfileState);

  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchUserProfile(user.uid));
    }
  }, [dispatch, user]);

  const deleteAccount = React.useCallback(async () => {
    try {
      setIsDeleting(true);
      const db = getFirestore();
      const userDoc = doc(db, `users/${user?.uid}`);
      await deleteDoc(userDoc);
      await auth.currentUser?.delete();
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  }, [auth.currentUser, user?.uid]);

  const handleDeletePress = React.useCallback(() => {
    Alert.alert(
      "This action will delete all your data and is irreversible. Are you sure you want to delete your account?",
      undefined,
      [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: deleteAccount,
          style: "destructive",
        },
      ],
    );
  }, [deleteAccount]);

  const handleLogOut = React.useCallback(async () => {
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
      <View style={styles.user}>
        {userProfile?.photo == null ? (
          <Icon style={styles.image} name="account-circle" color={theme.colors.grey2} size={70} />
        ) : (
          <Image
            style={styles.image}
            source={{ uri: userProfile.photo }}
            PlaceholderContent={
              <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
            }
          />
        )}
        <Text style={{ fontSize: 16 }}>{userProfile.name ?? userProfile.email ?? ""}</Text>
      </View>
      <View style={styles.actions}>
        <AccountAction
          icon={{ name: "edit" }}
          text="Edit account"
          onPress={() => navigation.navigate("EditAccountPage")}
        />
        <AccountAction
          icon={{ name: "delete" }}
          text={isDeleting ? "Deleting..." : "Delete account"}
          onPress={handleDeletePress}
        />
        <AccountAction icon={{ name: "logout" }} text="Sign out" onPress={handleLogOut} />
      </View>
    </View>
  );
}

interface AccountActionProps {
  icon: IconProps;
  text: string;
  onPress: () => void;
}

function AccountAction({ icon, text, onPress }: AccountActionProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  return (
    <TouchableOpacity style={styles.action} onPress={onPress}>
      <Icon {...icon} size={20} />
      <Text style={{ fontSize: 18 }}>{text}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: 15,
    },
    user: {
      alignItems: "center",
      rowGap: 5,
    },
    image: {
      height: 70,
      width: 70,
      borderRadius: 40,
    },
    actions: {
      marginTop: 20,
    },
    action: {
      paddingVertical: 15,
      flexDirection: "row",
      columnGap: 10,
      alignItems: "center",
      borderBottomWidth: 0.5,
      borderBottomColor: colors.primary,
    },
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 40,
      height: "100%",
      width: "100%",
    },
  });
