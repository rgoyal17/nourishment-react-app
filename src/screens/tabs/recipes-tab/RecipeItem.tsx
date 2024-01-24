import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme, Button, Icon, ListItem, Image } from "@rneui/themed";
import NumericInput from "react-native-numeric-input";
import { IngredientsAndInstructions } from "./IngredientsAndInstructions";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useAppDispatch } from "../../../redux/hooks";
import { deleteRecipe, fetchRecipes } from "../../../redux/recipesSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ navigation, route }: RecipeItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { recipe } = route.params;
  const dispatch = useAppDispatch();
  const { user } = useAuthentication();
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const [servings, setServings] = React.useState(
    recipe.servings !== "" ? Number(recipe.servings) : undefined,
  );
  const [parsedIngredients, setParsedIngredients] = React.useState(recipe.ingredientsParsed);
  const [isDeletingRecipe, setIsDeletingRecipe] = React.useState(false);

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
          onPress={() => bottomSheetRef.current?.present()}
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

  const handleDeleteRecipe = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to delete a recipe");
      return;
    }
    try {
      setIsDeletingRecipe(true);
      await dispatch(deleteRecipe({ userId: user.uid, recipeId: recipe.id }));
      await dispatch(fetchRecipes(user.uid));
      navigation.navigate("Recipes");
      bottomSheetRef.current?.dismiss();
    } catch (e) {
      Alert.alert("Failed to delete recipe");
    } finally {
      setIsDeletingRecipe(false);
    }
  }, [dispatch, navigation, recipe.id, user?.uid]);

  const handleEditRecipe = React.useCallback(() => {
    bottomSheetRef.current?.dismiss();
    navigation.navigate("Add Recipe", {
      recipe,
      source: "edit",
    });
  }, [navigation, recipe]);

  const handleChangeServings = React.useCallback(
    (newServings: number) => {
      setServings(newServings);
      setParsedIngredients(
        recipe.ingredientsParsed.map((ingredient) => {
          const originalQuantity = parseFloat(ingredient.quantity);
          const originalServings = parseFloat(recipe.servings);
          return isNaN(originalQuantity) || isNaN(originalServings)
            ? ingredient
            : {
                ...ingredient,
                quantity: (
                  Math.round((originalQuantity / originalServings) * newServings * 100) / 100
                ).toString(),
              };
        }),
      );
    },
    [recipe.ingredientsParsed, recipe.servings],
  );

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
                onChange={handleChangeServings}
                rounded
                totalHeight={30}
                totalWidth={100}
                value={servings}
              />
            </View>
          ) : null}
        </View>
        <IngredientsAndInstructions
          ingredients={parsedIngredients}
          instructions={recipe.instructions}
        />
      </ScrollView>

      <BottomSheetModal
        enablePanDownToClose
        ref={bottomSheetRef}
        snapPoints={["20%"]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ListItem onPress={handleEditRecipe}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="edit" />
            <ListItem.Title>Edit</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={handleDeleteRecipe}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="delete" />
            <ListItem.Title>{isDeletingRecipe ? "Deleting..." : "Delete"}</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheetModal>
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
      alignItems: "center",
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
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 20,
      rowGap: 10,
    },
    timeText: {
      fontSize: 18,
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
