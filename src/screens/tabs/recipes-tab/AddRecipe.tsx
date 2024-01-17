import { Text, StyleSheet, TextInput, View, Alert } from "react-native";
import React from "react";
import { Button, CheckBox, Colors, useTheme } from "@rneui/themed";
import OpenAI from "openai";
import Constants from "expo-constants";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AddImage } from "./AddImage";
import { StackScreenProps } from "@react-navigation/stack";
import { RecipesTabStackParamList } from "./RecipesTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { Recipe, addNewRecipe } from "../../../redux/recipesSlice";
import { useAppDispatch } from "../../../redux/hooks";

export const INITIAL_RECIPE: Recipe = {
  id: "",
  title: "",
  image: "",
  servings: "2",
  ingredients: [],
  instructions: [],
  cookTime: "",
  prepTime: "",
  totalTime: "",
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

type AddRecipeProps = StackScreenProps<RecipesTabStackParamList, "Add Recipe">;

export function AddRecipe({ navigation, route }: AddRecipeProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const { recipe: recipeFromParent } = route.params;

  const openai = new OpenAI({
    apiKey: Constants.expoConfig?.extra?.openAiKey,
  });
  const [recipe, setRecipe] = React.useReducer(
    (prev: Recipe, next: Partial<Recipe>) => ({ ...prev, ...next }),
    recipeFromParent ?? INITIAL_RECIPE,
  );

  const isCreatingFromScratch = recipeFromParent == null;

  const [shouldAutoGenerateImage, setShouldAutoGenerateImage] =
    React.useState(isCreatingFromScratch);

  const [isLoadingImage, setIsLoadingImage] = React.useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = React.useState(false);

  const [validationErrors, setValidationErrors] = React.useReducer(
    (prev: ValidationErrors, next: Partial<ValidationErrors>) => ({ ...prev, ...next }),
    INITIAL_VALIDATION_ERRORS,
  );

  const isFormValid = React.useCallback(() => {
    const { title, ingredients, instructions } = recipe;
    const isTitleEmpty = title.trim().length === 0;
    const isIngredientsEmpty = ingredients.length === 0;
    const isInstructionsEmpty = instructions.length === 0;
    setValidationErrors({ isTitleEmpty });
    setValidationErrors({ isIngredientsEmpty });
    setValidationErrors({ isInstructionsEmpty });
    return !isTitleEmpty && !isIngredientsEmpty && !isInstructionsEmpty;
  }, [recipe]);

  const addRecipe = React.useCallback(async () => {
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
      await dispatch(addNewRecipe({ userId: user.uid, recipe }));
      navigation.navigate("Recipes");
    } catch (e) {
      Alert.alert("Failed to add recipe");
    } finally {
      setIsAddingRecipe(false);
    }
  }, [user?.uid, isFormValid, dispatch, recipe, navigation]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => <Button onPress={addRecipe} title="Done" loading={isAddingRecipe} />,
    });
  }, [navigation, addRecipe, isAddingRecipe]);

  const generateImage = async () => {
    if (!shouldAutoGenerateImage || recipe.title.trim() === "") {
      return;
    }
    try {
      setIsLoadingImage(true);
      setRecipe({ image: "" });
      const res = await openai.images.generate({
        prompt: recipe.title,
        response_format: "url",
        size: "512x512",
      });
      setRecipe({ image: res.data.at(0)?.url ?? "" });
    } catch (e) {
      setRecipe({ image: "" });
    } finally {
      setIsLoadingImage(false);
    }
  };

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
        onEndEditing={generateImage}
      />
      {validationErrors.isTitleEmpty ? (
        <Text style={styles.error}>Title cannot be empty</Text>
      ) : null}
      {isCreatingFromScratch ? (
        <CheckBox
          containerStyle={styles.checkBox}
          title="AI generate my recipe image"
          checked={shouldAutoGenerateImage}
          uncheckedColor={theme.colors.primary}
          onPress={() => setShouldAutoGenerateImage((prevAutoGen) => !prevAutoGen)}
        />
      ) : null}
      <Text style={styles.title}>Image</Text>
      <AddImage
        image={recipe.image}
        isLoading={isLoadingImage}
        onChangeImage={(image: string) => setRecipe({ image })}
      />
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
        value={recipe.ingredients.join("\n")}
        multiline={true}
        placeholder="Write each ingredient on its own line (e.g. 1 lb potatoes).
Optional: add section headers (e.g. #spices)"
        onChangeText={(ingredients) => setRecipe({ ingredients: ingredients.split("\n") })}
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
        onChangeText={(instructions) => setRecipe({ instructions: instructions.split("\n") })}
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

    checkBox: {
      backgroundColor: "transparent",
      paddingLeft: 0,
      marginLeft: 0,
      marginBottom: 0,
      paddingBottom: 0,
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
