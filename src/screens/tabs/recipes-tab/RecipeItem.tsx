import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme } from "@rneui/themed";

const Header_Max_Height = 240;
const Header_Min_Height = 120;
const Scroll_Distance = Header_Max_Height - Header_Min_Height;

const DynamicHeader = ({ value }: any) => {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const animatedHeaderColor = value.interpolate({
    inputRange: [0, Scroll_Distance],
    outputRange: ["white", "black"],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.header,
        {
          backgroundColor: animatedHeaderColor,
        },
      ]}
    >
      <Text style={styles.title}>Header Content</Text>
    </Animated.View>
  );
};

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ route }: RecipeItemProps) {
  // const { theme } = useTheme();
  // const styles = makeStyles(theme.colors);

  const scrollOffsetY = useRef(new Animated.Value(0)).current;
  const { recipe } = route.params;

  return (
    <View>
      <DynamicHeader value={scrollOffsetY} />
      <ScrollView
        scrollEventThrottle={5}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollOffsetY } } }], {
          useNativeDriver: false,
        })}
      >
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
        <Text>{recipe.title}</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    header: {
      justifyContent: "center",
      alignItems: "center",
      left: 0,
      right: 0,
      paddingTop: 25,
      height: 100,
    },
    title: {
      color: "#ffff",
      fontWeight: "bold",
      fontSize: 20,
    },
  });
