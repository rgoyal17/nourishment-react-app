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
import {
  Ingredient,
  Recipe,
  addNewRecipe,
  editRecipe,
  fetchRecipes,
} from "../../../redux/recipesSlice";
import { useAppDispatch } from "../../../redux/hooks";

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

type AddOrEditRecipeProps = StackScreenProps<RecipesTabStackParamList, "Add Recipe">;

export function AddOrEditRecipe({ navigation, route }: AddOrEditRecipeProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const { recipe: recipeFromParent, source } = route.params;

  const openai = new OpenAI({
    apiKey: Constants.expoConfig?.extra?.openAiKey,
  });
  const [recipe, setRecipe] = React.useReducer(
    (prev: Recipe, next: Partial<Recipe>) => ({ ...prev, ...next }),
    recipeFromParent ?? INITIAL_RECIPE,
  );

  const [shouldAutoGenerateImage, setShouldAutoGenerateImage] = React.useState(
    source === "scratch",
  );

  const [isLoadingImage, setIsLoadingImage] = React.useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = React.useState(false);

  const [validationErrors, setValidationErrors] = React.useReducer(
    (prev: ValidationErrors, next: Partial<ValidationErrors>) => ({ ...prev, ...next }),
    INITIAL_VALIDATION_ERRORS,
  );

  const isFormValid = React.useCallback(() => {
    const { title, instructions, ingredientsRaw } = recipe;
    const isTitleEmpty = title.trim().length === 0;
    const isIngredientsEmpty = ingredientsRaw.length === 0;
    const isInstructionsEmpty = instructions.length === 0;
    setValidationErrors({ isTitleEmpty });
    setValidationErrors({ isIngredientsEmpty });
    setValidationErrors({ isInstructionsEmpty });
    return !isTitleEmpty && !isIngredientsEmpty && !isInstructionsEmpty;
  }, [recipe]);

  const getIngredientsAiInput = React.useCallback(() => {
    let ingredientsString = "[";
    recipe.ingredientsRaw.forEach((ingredient, index) => {
      ingredientsString += `{${ingredient}}`;
      if (index !== recipe.ingredientsRaw.length - 1) {
        ingredientsString += ", ";
      }
    });
    return (ingredientsString += "]");
  }, [recipe.ingredientsRaw]);

  const getAiParsedIngredients = React.useCallback(async () => {
    if (
      recipe.ingredientsParsed.length !== 0 &&
      recipeFromParent?.ingredientsRaw === recipe.ingredientsRaw
    ) {
      return recipe.ingredientsParsed;
    }

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You will be given a list of ingredient objects separated by a comma. Each ingredient might contain the item name, a quantity, and a unit of measurement. Your output format should be a JSON containing all ingredients of format { item: string, quantity: string, unit: string }. Use empty string when a value is not present. Quantity should always be numbers only. For example if you are given [{1 kg potatoes}, {3 onions}], you should return {ingredients: [{item: 'potatoes', quantity: `1.5`, unit: 'kg'}, {item: 'onions', quantity: '3', unit: ''}]}",
        },
        { role: "user", content: getIngredientsAiInput() },
      ],
      response_format: { type: "json_object" },
      model: "gpt-4-1106-preview",
    });
    const content = response.choices[0].message.content;
    return content == null ? null : (JSON.parse(content).ingredients as Ingredient[]);
  }, [
    getIngredientsAiInput,
    openai.chat.completions,
    recipe.ingredientsParsed,
    recipe.ingredientsRaw,
    recipeFromParent?.ingredientsRaw,
  ]);

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
      const aiParsedIngredients = await getAiParsedIngredients();
      if (aiParsedIngredients == null) {
        throw new Error("Failed to parse ingredients");
      }
      const updatedRecipe: Recipe = { ...recipe, ingredientsParsed: aiParsedIngredients };
      setRecipe({ ingredientsParsed: aiParsedIngredients });

      if (source === "edit") {
        await dispatch(editRecipe({ userId: user.uid, recipe: updatedRecipe }));
      } else {
        await dispatch(addNewRecipe({ userId: user.uid, recipe: updatedRecipe }));
      }
      await dispatch(fetchRecipes(user.uid));
      navigation.navigate("Recipes");
    } catch (e) {
      Alert.alert("Failed to add recipe");
    } finally {
      setIsAddingRecipe(false);
    }
  }, [user?.uid, isFormValid, getAiParsedIngredients, recipe, source, navigation, dispatch]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={handleAddOrEditRecipe} title="Done" loading={isAddingRecipe} />
      ),
      headerTitle: source === "edit" ? "Edit Recipe" : "Add Recipe",
    });
  }, [navigation, handleAddOrEditRecipe, isAddingRecipe, source]);

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

  const handleChangeInstructions = React.useCallback(
    (instructions: string) =>
      setRecipe({
        instructions: instructions.split("\n").filter((instruction) => instruction.trim() !== ""),
      }),
    [],
  );

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
      {source === "scratch" ? (
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
        onChangeText={handleChangeInstructions}
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
