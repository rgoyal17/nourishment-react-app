import React from "react";
import { View, Image, StyleSheet, ImageURISource, StyleProp, ImageStyle } from "react-native";
import { Text, useTheme, Button, ButtonProps, Colors } from "@rneui/themed";
import { compact } from "lodash";

interface ZeroStateProps {
  imgSrc: ImageURISource;
  imgStyle?: StyleProp<ImageStyle>;
  title: string;
  subtitle: string;
  actionButtonProps: ButtonProps;
}
export function ZeroState({
  imgSrc,
  imgStyle,
  title,
  subtitle,
  actionButtonProps,
}: ZeroStateProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  return (
    <View style={styles.container}>
      <Image source={imgSrc} style={compact([styles.image, imgStyle])} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subText}>{subtitle}</Text>
      <Button {...actionButtonProps} style={styles.action} radius={10} />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 60,
    },
    image: {
      height: 350,
      width: 350,
      opacity: 0.7,
    },
    title: {
      fontWeight: "600",
      fontSize: 17,
      paddingTop: 10,
      paddingBottom: 10,
    },
    subText: {
      textAlign: "center",
      color: colors.grey2,
      paddingBottom: 30,
    },
    action: {
      width: 250,
    },
  });
