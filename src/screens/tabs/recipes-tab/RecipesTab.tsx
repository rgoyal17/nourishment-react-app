import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { AddOrEditRecipe } from "./AddOrEditRecipe";
import { Recipes } from "./Recipes";
import { RecipeItem } from "./RecipeItem";
import { Button, useTheme } from "@rneui/themed";
import { Icon } from "@rneui/base";
import { Recipe } from "../../../redux/recipesSlice";
import { HEADER_HEIGHT } from "../../../common/constants";

export type RecipesTabStackParamList = {
  AddOrEditRecipe: { recipe?: Recipe; source: "scratch" | "import" | "edit" };
  RecipeItem: { recipe: Recipe };
  Recipes: undefined;
};

const Stack = createStackNavigator<RecipesTabStackParamList>();

export function RecipesTab() {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;

  return (
    <Stack.Navigator
      initialRouteName="Recipes"
      screenOptions={{
        headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
        headerBackTitleVisible: false,
        headerTintColor: secondary,
        headerBackImage: () => <Icon color={secondary} name="chevron-left" size={40} />,
      }}
    >
      <Stack.Screen
        name="AddOrEditRecipe"
        component={AddOrEditRecipe}
        options={{ headerRight: () => <Button title="Done" /> }}
      />
      <Stack.Screen name="RecipeItem" component={RecipeItem} options={{ title: "" }} />
      <Stack.Screen name="Recipes" component={Recipes} />
    </Stack.Navigator>
  );
}
