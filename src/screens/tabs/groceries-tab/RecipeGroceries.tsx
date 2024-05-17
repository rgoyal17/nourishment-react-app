import { Button, Colors, useTheme } from "@rneui/themed";
import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Recipe, fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { MultiSelect } from "../../../common/MultiSelect";
import { combineIngredients } from "../../../common/combineIngredients";
import { IngredientsList } from "./IngredientsList";
import { ZeroState } from "../../../common/ZeroState";
import {
  GroceryItem,
  addGroceryItems,
  fetchGroceries,
  selectGroceriesState,
} from "../../../redux/groceriesSlice";
import { compact } from "lodash";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import * as Sentry from "@sentry/react-native";

type RecipeGroceriesProps = StackScreenProps<GroceriesTabStackParamList, "RecipeGroceries">;

export function RecipeGroceries({ navigation }: RecipeGroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const recipes = useAppSelector(selectAllRecipes);
  const groceriesState = useAppSelector(selectGroceriesState);

  const [selectedRecipes, setSelectedRecipes] = React.useState<Recipe[]>([]);
  const [checkedIngredients, setCheckedIngredients] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const ingredients = combineIngredients(
    selectedRecipes.flatMap((recipe) => recipe.ingredientsParsed),
  );

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
    }
  }, [dispatch, user]);

  const handleRefresh = React.useCallback(async () => {
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
    }
  }, [dispatch, user]);

  const handleCheckChange = React.useCallback((updatedItem: string) => {
    setCheckedIngredients((prev) =>
      prev.includes(updatedItem)
        ? [...prev].filter((i) => i !== updatedItem)
        : [...prev, updatedItem],
    );
  }, []);

  const addIngredientsToGroceries = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add a recipe");
      return;
    }
    try {
      setIsLoading(true);
      const checkedIngredientsObjs: GroceryItem[] = compact(
        checkedIngredients.map((ingr) => ingredients.find((i) => i.item === ingr)),
      ).map((ingr) => ({ ...ingr, isChecked: false }));

      await dispatch(
        addGroceryItems({
          userId: user.uid,
          existingGroceryItems: groceriesState.groceryItems,
          groceryItems: checkedIngredientsObjs,
        }),
      );

      await dispatch(fetchGroceries(user.uid));
      navigation.navigate("GroceriesPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add grocery item");
    }
  }, [
    checkedIngredients,
    dispatch,
    groceriesState.groceryItems,
    ingredients,
    navigation,
    user?.uid,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.recipes}>
        <MultiSelect
          items={recipes}
          searchInputLabel="Search recipes..."
          selectedItems={selectedRecipes}
          selectInputLabel="Select recipes..."
          submitButtonLabel="Done"
          onSelectItems={(items) => setSelectedRecipes(items)}
        />
      </View>
      {ingredients.length === 0 ? (
        <ZeroState
          imgSrc={require("../../../../assets/groceries.png")}
          imgStyle={styles.zeroStateImg}
          title="No Ingredients Found"
          subtitle="Select some recipes to view a list of ingredients here"
        />
      ) : (
        <IngredientsList
          ingredients={ingredients}
          checkedIngredients={checkedIngredients}
          onCheckChange={handleCheckChange}
          onRefresh={handleRefresh}
        />
      )}
      {checkedIngredients.length > 0 ? (
        <Button
          containerStyle={{ alignItems: "center" }}
          loading={isLoading}
          buttonStyle={styles.doneButton}
          title="Add to Grocery List"
          onPress={addIngredientsToGroceries}
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    zeroStateImg: {
      opacity: 0.6,
      marginTop: -40,
      height: 170,
      width: 170,
    },
    recipes: {
      padding: 15,
      rowGap: 10,
    },
    recipesText: {
      fontSize: 15,
      fontWeight: "500",
    },
    doneButton: {
      borderRadius: 10,
      marginBottom: 10,
      width: 300,
    },
  });
