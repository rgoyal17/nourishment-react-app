import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme } from "@rneui/themed";

const HEADER_MAX_HEIGHT = 400;
const HEADER_MIN_HEIGHT = 103;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ route }: RecipeItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { recipe } = route.params;
  const [isLoading, setIsLoading] = React.useState(true);

  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  const data = Array.from({ length: 30 });

  const headerHeight = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const imageOpacity = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });
  const imageTranslate = scrollOffsetY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -100],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }], {
          useNativeDriver: false,
        })}
      >
        <View style={styles.scrollViewContent}>
          {data.map((_, i) => (
            <View key={i} style={styles.row}>
              <Text>{i}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {isLoading ? (
          <ActivityIndicator
            style={styles.backgroundImage}
            color={theme.colors.secondary}
            size="large"
          />
        ) : null}
        <Animated.Image
          style={[
            styles.backgroundImage,
            { opacity: imageOpacity, transform: [{ translateY: imageTranslate }] },
          ]}
          source={{ uri: recipe.image }}
          onLoad={() => setIsLoading(false)}
        />
        <View style={styles.bar}>
          <Text style={styles.title}>Title</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    scrollViewContent: {
      marginTop: HEADER_MAX_HEIGHT,
    },
    row: {
      height: 40,
      margin: 16,
      backgroundColor: "#D3D3D3",
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary,
      overflow: "hidden",
    },
    bar: {
      marginTop: 50,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: colors.secondary,
    },
    backgroundImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_MAX_HEIGHT,
    },
  });
