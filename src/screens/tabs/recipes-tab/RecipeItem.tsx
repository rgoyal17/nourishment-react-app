import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme, Image, Button, Icon, BottomSheet, ListItem } from "@rneui/themed";
import NumericInput from "react-native-numeric-input";
import { IngredientsAndInstructions } from "./IngredientsAndInstructions";

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ navigation, route }: RecipeItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { recipe } = route.params;
  const [isBottomSheetVisible, setIsBottomSheetVisible] = React.useState(false);
  const [servings, setServings] = React.useState(
    recipe.servings !== "" ? Number(recipe.servings) : undefined,
  );

  const imageExists = React.useMemo(() => recipe.image !== "", [recipe.image]);

  const yOffset = useRef(new Animated.Value(0)).current;

  const backgroundColor = yOffset.interpolate({
    inputRange: [0, 400],
    outputRange: ["rgba(61, 172, 120, 0)", "rgba(61, 172, 120, 1)"],
    extrapolate: "clamp",
  });

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          color={theme.colors.secondary}
          buttonStyle={styles.headerButton}
          icon={<Icon name="chevron-left" color={theme.colors.primary} size={30} />}
          onPress={() => navigation.goBack()}
        />
      ),
      headerRight: () => (
        <Button
          color={theme.colors.secondary}
          buttonStyle={styles.headerButton}
          icon={<Icon name="more-horiz" color={theme.colors.primary} size={30} />}
          onPress={() => setIsBottomSheetVisible(true)}
        />
      ),
    });
  }, [navigation, styles.headerButton, theme.colors]);

  React.useEffect(() => {
    if (imageExists) {
      navigation.setOptions({
        headerBackground: () => (
          <Animated.View style={{ backgroundColor, ...StyleSheet.absoluteFillObject }} />
        ),
        headerTransparent: imageExists,
      });
    }
  }, [backgroundColor, navigation, imageExists, theme.colors.primary]);

  return (
    <View style={styles.container}>
      <ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: yOffset } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {imageExists ? (
          <Image
            style={{ height: 400 }}
            source={{ uri: recipe.image }}
            PlaceholderContent={
              <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
            }
          />
        ) : null}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.prepTime !== "" || recipe.cookTime !== "" ? (
            <View style={styles.time}>
              {recipe.prepTime != "" ? (
                <Text style={styles.timeText}>Prep time: {recipe.prepTime} mins</Text>
              ) : null}
              {recipe.cookTime !== "" ? (
                <Text style={styles.timeText}>Cook time: {recipe.cookTime} mins</Text>
              ) : null}
            </View>
          ) : null}
          {servings != null ? (
            <View style={styles.servings}>
              <Text style={styles.servingsText}>Servings: </Text>
              <NumericInput
                minValue={1}
                onChange={(serving) => setServings(serving)}
                rounded
                totalHeight={30}
                totalWidth={100}
                value={servings}
              />
            </View>
          ) : null}
        </View>
        <Text>lalalala</Text>
        <IngredientsAndInstructions
          ingredients={recipe.ingredients}
          instructions={recipe.instructions}
        />
      </ScrollView>

      <BottomSheet
        isVisible={isBottomSheetVisible}
        onBackdropPress={() => setIsBottomSheetVisible(false)}
      >
        <ListItem>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="edit" />
            <ListItem.Title>Edit</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={{ paddingBottom: 40 }}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="delete" />
            <ListItem.Title>Delete</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheet>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    headerButton: {
      borderRadius: 30,
      padding: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginHorizontal: 10,
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      columnGap: 10,
    },
    activityIndicator: {
      backgroundColor: colors.secondary,
      height: "100%",
      width: "100%",
    },
    content: {
      padding: 20,
      display: "flex",
      rowGap: 10,
    },
    title: {
      fontSize: 30,
      fontWeight: "500",
    },
    time: {
      display: "flex",
      flexDirection: "row",
      columnGap: 20,
    },
    timeText: {
      fontSize: 20,
      fontWeight: "400",
    },
    servings: {
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
    },
    servingsText: {
      fontSize: 15,
      fontWeight: "400",
    },
  });
