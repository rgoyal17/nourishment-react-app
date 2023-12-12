import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Button, Colors, Icon, useTheme } from "@rneui/themed";
import { Recipe } from "../../../redux/recipesSlice";

const HEADER_MAX_HEIGHT = 400;
const HEADER_MIN_HEIGHT = 103;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ navigation, route }: RecipeItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { recipe } = route.params;

  const scrollOffsetY = useRef(new Animated.Value(0)).current;

  const data = Array.from({ length: 30 });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
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
      <DynamicHeader
        recipe={recipe}
        scrollOffsetY={scrollOffsetY}
        onBackPress={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
}

interface DynamicHeaderProps {
  recipe: Recipe;
  scrollOffsetY: Animated.Value;
  onBackPress: () => void;
}

function DynamicHeader({ recipe, scrollOffsetY, onBackPress }: DynamicHeaderProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = React.useState(false);

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
      <View style={styles.headerContent}>
        <Button
          color={theme.colors.white}
          icon={<Icon name="chevron-left" color={theme.colors.primary} size={30} />}
          buttonStyle={styles.headerButton}
          onPress={onBackPress}
        />
        <Button
          color={theme.colors.white}
          icon={<Icon name="more-horiz" color={theme.colors.primary} size={30} />}
          buttonStyle={styles.headerButton}
          onPress={() => setIsBottomSheetVisible(true)}
        />
      </View>
    </Animated.View>
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
    headerContent: {
      marginTop: 60,
      marginLeft: 10,
      marginRight: 10,
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerButton: {
      borderRadius: 30,
      padding: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
    backgroundImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_MAX_HEIGHT,
    },
  });
