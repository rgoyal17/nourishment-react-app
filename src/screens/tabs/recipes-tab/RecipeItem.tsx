import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme, Button, Icon, ListItem, CheckBox, Tooltip } from "@rneui/themed";
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
  const [servings, setServings] = React.useState(recipe.servings);
  const [parsedIngredients, setParsedIngredients] = React.useState(recipe.ingredientsParsed);
  const [isDeletingRecipe, setIsDeletingRecipe] = React.useState(false);

  const imageExists = React.useMemo(() => recipe.image !== "", [recipe.image]);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);

  const shouldShowFormattedCheckbox = React.useMemo(
    () =>
      recipe.ingredientsParsed.some((parsedIngredient) => parsedIngredient.quantity.trim() !== ""),
    [recipe.ingredientsParsed],
  );

  const [isFormattedChecked, setIsFormattedChecked] = React.useState(shouldShowFormattedCheckbox);
  const [isTooltipOpen, setIsTooltipOpen] = React.useState(false);

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

  const handleDeleteClick = React.useCallback(async () => {
    Alert.alert("Are you sure you want to delete this recipe?", undefined, [
      { text: "Cancel" },
      { text: "Delete", onPress: handleDeleteRecipe, style: "destructive" },
    ]);
  }, [handleDeleteRecipe]);

  const handleEditRecipe = React.useCallback(() => {
    bottomSheetRef.current?.dismiss();
    navigation.navigate("AddOrEditRecipe", { recipe, source: "edit" });
  }, [navigation, recipe]);

  const handleChangeServings = React.useCallback(
    (newServings: string) => {
      setServings(newServings);
      let numServings = parseFloat(newServings);
      if (isNaN(numServings) || numServings < 0) {
        numServings = 0;
      }
      setParsedIngredients(
        recipe.ingredientsParsed.map((ingredient) => {
          const originalQuantity = parseFloat(ingredient.quantity);
          const originalServings = parseFloat(recipe.servings);
          return isNaN(originalQuantity) || isNaN(originalServings)
            ? ingredient
            : {
                ...ingredient,
                quantity: (
                  Math.round((originalQuantity / originalServings) * numServings * 100) / 100
                ).toString(),
              };
        }),
      );
    },
    [recipe.ingredientsParsed, recipe.servings],
  );

  const handleEndEditingServings = React.useCallback(() => {
    const numServings = parseFloat(servings);
    if (isNaN(numServings) || numServings < 0) {
      setServings("0");
    }
  }, [servings]);

  const handleFormattedCheckChange = React.useCallback(() => {
    handleChangeServings(recipe.servings);
    setIsFormattedChecked((prev) => !prev);
  }, [handleChangeServings, recipe.servings]);

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
          {recipe.servings !== "" ? (
            <View style={styles.servings}>
              <Text style={styles.textSize}>Servings: </Text>
              {isFormattedChecked ? (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={servings}
                  returnKeyType="done"
                  editable={isFormattedChecked}
                  onChangeText={handleChangeServings}
                  onEndEditing={handleEndEditingServings}
                />
              ) : (
                <Text style={styles.textSize}>{servings}</Text>
              )}
            </View>
          ) : null}
          {recipe.websiteUrl != null ? (
            <Text style={styles.textSize} numberOfLines={2}>
              Source:&nbsp;
              {
                <Text style={styles.link} onPress={() => Linking.openURL(recipe.websiteUrl ?? "")}>
                  {recipe.websiteUrl}
                </Text>
              }
            </Text>
          ) : null}
          {shouldShowFormattedCheckbox ? (
            <View style={styles.checkbox}>
              <CheckBox
                title="View formatted ingredients"
                checked={isFormattedChecked}
                onPress={handleFormattedCheckChange}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
              <Tooltip
                visible={isTooltipOpen}
                onOpen={() => setIsTooltipOpen(true)}
                onClose={() => setIsTooltipOpen(false)}
                popover={<Text>We parse your ingredients to format them</Text>}
                width={300}
                backgroundColor={theme.colors.white}
              >
                <Icon color={theme.colors.primary} name="help" />
              </Tooltip>
            </View>
          ) : null}
        </View>
        <IngredientsAndInstructions
          instructions={recipe.instructions}
          isFormattedChecked={isFormattedChecked}
          parsedIngredients={parsedIngredients}
          rawIngredients={recipe.ingredientsRaw}
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
        <ListItem onPress={handleDeleteClick}>
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
      paddingBottom: 10,
      display: "flex",
      rowGap: 10,
    },
    title: {
      fontSize: 30,
      fontWeight: "500",
      paddingBottom: 10,
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
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 30,
      width: 50,
    },
    servings: {
      alignItems: "center",
      flexDirection: "row",
      height: 35,
    },
    textSize: {
      fontSize: 15,
    },
    image: {
      height: IMG_HEIGHT,
      width,
    },
    checkbox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    checkboxContainer: {
      backgroundColor: colors.secondary,
      paddingLeft: 0,
      marginLeft: 0,
      marginVertical: 0,
      paddingVertical: 0,
    },
    checkboxText: {
      fontWeight: "500",
    },
    link: {
      color: colors.grey3,
    },
  });
