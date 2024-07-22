import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as React from "react";
import { Colors, Icon, Image, useTheme } from "@rneui/themed";
import { useAuthContext } from "../../../contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  fetchUserProfile,
  selectUserProfileState,
  updateUserProfile,
} from "../../../redux/userProfileSlice";
import * as Sentry from "@sentry/react-native";

export function EditAccountPage() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();
  const { userProfile } = useAppSelector(selectUserProfileState);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchUserProfile(user.uid));
    }
  }, [dispatch, user]);

  const handleEditImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && user != null) {
      try {
        setIsLoading(true);
        await dispatch(
          updateUserProfile({
            userId: user.uid,
            existingUserProfile: userProfile,
            updatedUserProfile: { photo: result.assets[0].uri },
          }),
        );
        await dispatch(fetchUserProfile(user.uid));
      } catch (e) {
        Sentry.captureException(e);
        Alert.alert("Failed to update profile");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ flex: 1 }} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {userProfile.photo != null ? (
        <View style={styles.section}>
          <Text style={styles.header}>Profile Image</Text>
          <View style={styles.content}>
            <Image
              style={styles.image}
              source={{ uri: userProfile.photo }}
              PlaceholderContent={
                <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
              }
            />
            <TouchableOpacity style={styles.roundButton} onPress={handleEditImage}>
              <Icon name="edit" color={theme.colors.secondary} size={15} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: 15,
    },
    section: {
      rowGap: 10,
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
      borderRadius: 20,
      height: "100%",
      width: "100%",
    },
  });
