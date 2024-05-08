import { createStackNavigator } from "@react-navigation/stack";
import { Icon, useTheme } from "@rneui/themed";
import React from "react";
import { HEADER_HEIGHT } from "../../../common/constants";
import { IngredientsPage } from "./IngredientsPage";
import { CalendarTabStackParamList } from "../calendar-tab/CalendarTab";
import { FindRecipes } from "./FindRecipes";
import { RecipesTabStackParamList } from "../recipes-tab/RecipesTab";

export type IngredientsTabStackParamList = {
  RecipesTab: { screen: keyof RecipesTabStackParamList; params: any };
  CalendarTab: { screen: keyof CalendarTabStackParamList; params: any };
  IngredientsPage: undefined;
  FindRecipes: undefined;
};

const Stack = createStackNavigator<IngredientsTabStackParamList>();

export function IngredientsTab() {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;

  return (
    <Stack.Navigator
      initialRouteName="IngredientsPage"
      screenOptions={{
        headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
        headerBackTitleVisible: false,
        headerTintColor: secondary,
        headerBackImage: () => <Icon color={secondary} name="chevron-left" size={40} />,
      }}
    >
      <Stack.Screen
        name="IngredientsPage"
        component={IngredientsPage}
        options={{ title: "Ingredients" }}
      />
      <Stack.Screen
        name="FindRecipes"
        component={FindRecipes}
        options={{ title: "Find Recipes" }}
      />
    </Stack.Navigator>
  );
}
