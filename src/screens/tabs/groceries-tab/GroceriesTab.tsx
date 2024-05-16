import { createStackNavigator } from "@react-navigation/stack";
import { Icon, useTheme } from "@rneui/themed";
import React from "react";
import { HEADER_HEIGHT } from "../../../common/constants";
import { GroceriesPage } from "./GroceriesPage";
import { CalendarTabStackParamList } from "../calendar-tab/CalendarTab";
import { FindRecipes } from "./FindRecipes";
import { RecipesTabStackParamList } from "../recipes-tab/RecipesTab";
import { CalendarGroceries } from "./CalendarGroceries";

export type GroceriesTabStackParamList = {
  RecipesTab: { screen: keyof RecipesTabStackParamList; params: any };
  CalendarTab: { screen: keyof CalendarTabStackParamList; params: any };
  GroceriesPage: undefined;
  CalendarGroceries: undefined;
  FindRecipes: undefined;
};

const Stack = createStackNavigator<GroceriesTabStackParamList>();

export function GroceriesTab() {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;

  return (
    <Stack.Navigator
      initialRouteName="GroceriesPage"
      screenOptions={{
        headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
        headerBackTitleVisible: false,
        headerTintColor: secondary,
        headerBackImage: () => <Icon color={secondary} name="chevron-left" size={40} />,
      }}
    >
      <Stack.Screen
        name="GroceriesPage"
        component={GroceriesPage}
        options={{ title: "Groceries" }}
      />
      <Stack.Screen
        name="CalendarGroceries"
        component={CalendarGroceries}
        options={{ title: "Choose from Calendar" }}
      />
      <Stack.Screen
        name="FindRecipes"
        component={FindRecipes}
        options={{ title: "Find Recipes" }}
      />
    </Stack.Navigator>
  );
}
