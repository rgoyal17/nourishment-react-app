import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme, Button, Icon, ListItem } from "@rneui/themed";
import NumericInput from "react-native-numeric-input";
import { IngredientsAndInstructions } from "./IngredientsAndInstructions";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { useAppDispatch } from "../../../redux/hooks";
import { deleteRecipe, fetchRecipes } from "../../../redux/recipesSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

const { width } = Dimensions.get("window");
const IMG_HEIGHT = 400;

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
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-IMG_HEIGHT, 0, IMG_HEIGHT],
          [-IMG_HEIGHT, 0, 0],
        ),
      },
      { scale: interpolate(scrollOffset.value, [-IMG_HEIGHT, 0, IMG_HEIGHT], [2, 1, 1]) },
    ],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT * 0.75], [0, 1]),
  }));

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
        headerBackground: () => <Animated.View style={[styles.header, headerAnimatedStyle]} />,
        headerTransparent: true,
      });
    }
  }, [navigation, imageExists, theme.colors.primary, headerAnimatedStyle, styles.header]);

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
      <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
        {imageExists ? (
          <View>
            <Animated.Image
              style={[styles.image, imageAnimatedStyle]}
              source={{ uri: recipe.image }}
              onLoadEnd={() => setIsImageLoaded(true)}
            />
            {!isImageLoaded ? (
              <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
            ) : null}
          </View>
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
      </Animated.ScrollView>

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
    header: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primary,
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
    },
    activityIndicator: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.secondary,
      height: IMG_HEIGHT,
      width,
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
    image: {
      height: IMG_HEIGHT,
      width,
    },
  });
