import { Button, Colors, Icon, useTheme } from "@rneui/themed";
import React from "react";
import { ImageBackground, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

interface AddImageProps {
  image: string;
  isLoading: boolean;

  onChangeImage: (image: string) => void;
}

export function AddImage({ image, isLoading, onChangeImage }: AddImageProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      onChangeImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      {image === "" ? (
        <Button
          type="clear"
          style={styles.imageZeroState}
          disabled={isLoading}
          loading={isLoading}
          onPress={pickImage}
        >
          {isLoading ? null : (
            <View>
              <Icon name="photo" size={60} color={theme.colors.grey3} />
              <Text style={styles.addPhotoText}>Add a photo</Text>
            </View>
          )}
        </Button>
      ) : (
        <ImageBackground style={styles.image} source={{ uri: image }}>
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={{
                ...styles.roundButton,
                backgroundColor: theme.colors.primary,
              }}
              onPress={pickImage}
            >
              <Icon name="edit" color={theme.colors.white} size={15} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...styles.roundButton,
                backgroundColor: theme.colors.error,
              }}
              onPress={() => onChangeImage("")}
            >
              <Icon name="delete" color={theme.colors.white} size={15} />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    imageZeroState: {
      backgroundColor: colors.white,
      height: 256,
      width: "100%",
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },

    addPhotoText: {
      color: colors.grey2,
      fontSize: 20,
      marginTop: 5,
    },

    image: {
      height: 256,
      width: "100%",
      borderRadius: 10,
    },

    imageButtons: {
      justifyContent: "flex-end",
      display: "flex",
      flexDirection: "row",
      columnGap: 5,
      margin: 10,
    },

    roundButton: {
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 100,
    },
  });
