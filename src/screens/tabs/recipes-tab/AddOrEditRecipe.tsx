import { Text, StyleSheet, TextInput, View, Alert } from "react-native";
import React from "react";
import { Button, Colors, useTheme } from "@rneui/themed";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AddImage } from "./AddImage";
import { StackScreenProps } from "@react-navigation/stack";
import { RecipesTabStackParamList } from "./RecipesTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { Recipe, addNewRecipe, editRecipe, fetchRecipes } from "../../../redux/recipesSlice";
import { useAppDispatch } from "../../../redux/hooks";
import * as Sentry from "@sentry/react-native";
import { isEqual } from "lodash";

export const INITIAL_RECIPE: Recipe = {
  id: "",
  title: "",
  image: "",
  servings: "2",
  ingredientsParsed: [],
  ingredientsRaw: [],
  instructions: [],
  cookTime: "",
  prepTime: "",
  isParsing: false,
  isoDate: new Date().toISOString(),
};

interface ValidationErrors {
  isTitleEmpty: boolean;
  isIngredientsEmpty: boolean;
  isInstructionsEmpty: boolean;
}

const INITIAL_VALIDATION_ERRORS: ValidationErrors = {
  isTitleEmpty: false,
  isIngredientsEmpty: false,
  isInstructionsEmpty: false,
};

type AddOrEditRecipeProps = StackScreenProps<RecipesTabStackParamList, "AddOrEditRecipe">;

export function AddOrEditRecipe({ navigation, route }: AddOrEditRecipeProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const { recipe: recipeFromParent, source } = route.params;

  const [recipe, setRecipe] = React.useReducer(
    (prev: Recipe, next: Partial<Recipe>) => ({ ...prev, ...next }),
    recipeFromParent ?? INITIAL_RECIPE,
  );

  const filteredIngredients = React.useMemo(
    () => recipe.ingredientsRaw.filter((ing) => ing.trim().length !== 0),
    [recipe.ingredientsRaw],
  );
  const filteredInstructions = React.useMemo(
    () => recipe.instructions.filter((ins) => ins.trim().length !== 0),
    [recipe.instructions],
  );

  const [isAddingRecipe, setIsAddingRecipe] = React.useState(false);

  const [validationErrors, setValidationErrors] = React.useReducer(
    (prev: ValidationErrors, next: Partial<ValidationErrors>) => ({ ...prev, ...next }),
    INITIAL_VALIDATION_ERRORS,
  );

  const isFormValid = React.useCallback(() => {
    const isTitleEmpty = recipe.title.trim().length === 0;
    const isIngredientsEmpty = filteredIngredients.length === 0;
    const isInstructionsEmpty = filteredInstructions.length === 0;
    setValidationErrors({ isTitleEmpty });
    setValidationErrors({ isIngredientsEmpty });
    setValidationErrors({ isInstructionsEmpty });
    return !isTitleEmpty && !isIngredientsEmpty && !isInstructionsEmpty;
  }, [filteredIngredients.length, filteredInstructions.length, recipe.title]);

  const handleAddOrEditRecipe = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add a recipe");
      return;
    }
    if (!isFormValid()) {
      Alert.alert("Please fill all the required fields");
      return;
    }
    try {
      setIsAddingRecipe(true);
      const didIngredientsChange = !isEqual(
        recipeFromParent?.ingredientsRaw,
        recipe.ingredientsRaw,
      );
      const updatedRecipe: Recipe = {
        ...recipe,
        ingredientsParsed: didIngredientsChange ? [] : recipe.ingredientsParsed,
        isParsing: didIngredientsChange,
        ingredientsRaw: filteredIngredients,
        instructions: filteredInstructions,
      };
      let response;
      if (source === "edit") {
        response = await dispatch(editRecipe({ userId: user.uid, recipe: updatedRecipe }));
      } else {
        response = await dispatch(addNewRecipe({ userId: user.uid, recipe: updatedRecipe }));
      }
      await dispatch(fetchRecipes(user.uid));
      const responseRecipe = response.payload as Recipe | undefined;
      if (responseRecipe == null) {
        navigation.navigate("Recipes");
      } else {
        navigation.pop();
        navigation.navigate("RecipeItem", { recipeId: responseRecipe.id });
      }
    } catch (e) {
      Alert.alert("Failed to add recipe");
      Sentry.captureException(e);
    } finally {
      setIsAddingRecipe(false);
    }
  }, [
    user?.uid,
    isFormValid,
    recipe,
    recipeFromParent?.ingredientsRaw,
    filteredIngredients,
    filteredInstructions,
    source,
    dispatch,
    navigation,
  ]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleAddOrEditRecipe} title="Done" loading={isAddingRecipe} />
      ),
      headerTitle: source === "edit" ? "Edit Recipe" : "Add Recipe",
    });
  }, [navigation, handleAddOrEditRecipe, isAddingRecipe, source]);

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
      style={{ backgroundColor: theme.colors.secondary }}
    >
      <Text style={{ ...styles.title, marginTop: 0 }}>Title</Text>
      <TextInput
        style={styles.input}
        value={recipe.title}
        returnKeyType="done"
        placeholder="Enter title..."
        onChangeText={(title) => setRecipe({ title })}
      />
      {validationErrors.isTitleEmpty ? (
        <Text style={styles.error}>Title cannot be empty</Text>
      ) : null}
      <Text style={styles.title}>Image</Text>
      <AddImage image={recipe.image} onChangeImage={(image: string) => setRecipe({ image })} />
      <Text style={styles.title}>Servings</Text>
      <Text style={styles.subLabel}>Ingredients can be automatically scaled using servings</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={recipe.servings}
        returnKeyType="done"
        placeholder="Enter serving size..."
        onChangeText={(servings) => setRecipe({ servings })}
      />
      <Text style={styles.title}>Ingredients</Text>
      <TextInput
        style={[styles.input, styles.tallerInput]}
        value={recipe.ingredientsRaw.join("\n")}
        multiline={true}
        placeholder="Write each ingredient on its own line (e.g. 1 lb potatoes).
Optional: add section headers (e.g. #spices)"
        onChangeText={(value) => setRecipe({ ingredientsRaw: value.split("\n") })}
      />
      {validationErrors.isIngredientsEmpty ? (
        <Text style={styles.error}>Ingredients cannot be empty</Text>
      ) : null}
      <Text style={styles.title}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.tallerInput]}
        value={recipe.instructions.join("\n")}
        multiline={true}
        placeholder="Enter instructions..."
        onChangeText={(instructions: string) =>
          setRecipe({ instructions: instructions.split("\n") })
        }
      />
      {validationErrors.isInstructionsEmpty ? (
        <Text style={styles.error}>Instructions cannot be empty</Text>
      ) : null}
      <View style={styles.timeContainer}>
        <View>
          <Text style={styles.title}>Cook time</Text>
          <TextInput
            style={styles.input}
            value={recipe.cookTime}
            keyboardType="numeric"
            placeholder="mins"
            onChangeText={(cookTime) => setRecipe({ cookTime })}
          />
        </View>
        <View>
          <Text style={styles.title}>Prep time</Text>
          <TextInput
            style={styles.input}
            value={recipe.prepTime}
            keyboardType="numeric"
            placeholder="mins"
            onChangeText={(prepTime) => setRecipe({ prepTime })}
          />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },

    error: {
      marginTop: 5,
      color: colors.error,
    },

    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 20,
    },

    subLabel: {
      color: colors.grey2,
    },

    input: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 10,
      height: 35,
      marginTop: 10,
    },

    tallerInput: {
      paddingTop: 10,
      height: 200,
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },

    timeContainer: {
      display: "flex",
      flexDirection: "row",
      columnGap: 50,
    },
  });
