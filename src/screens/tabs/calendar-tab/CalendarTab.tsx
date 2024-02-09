import { createStackNavigator } from "@react-navigation/stack";
import { Button, Icon, useTheme } from "@rneui/themed";
import React from "react";
import { CalendarPage } from "./CalendarPage";
import { AddCalendarItem } from "./AddCalendarItem";
import { HEADER_HEIGHT } from "../../../common/constants";
import { RecipesTabStackParamList } from "../recipes-tab/RecipesTab";

export type CalendarTabStackParamList = {
  RecipesTab: { screen: keyof RecipesTabStackParamList; params: any };
  AddCalendarItem: undefined;
  CalendarPage: undefined;
};

const Stack = createStackNavigator<CalendarTabStackParamList>();

export function CalendarTab() {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;

  return (
    <Stack.Navigator
      initialRouteName="CalendarPage"
      screenOptions={{
        headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
        headerBackTitleVisible: false,
        headerTintColor: secondary,
        headerBackImage: () => <Icon color={secondary} name="chevron-left" size={40} />,
      }}
    >
      <Stack.Screen
        name="AddCalendarItem"
        component={AddCalendarItem}
        options={{ headerRight: () => <Button title="Done" />, title: "Add To Calendar" }}
      />
      <Stack.Screen name="CalendarPage" component={CalendarPage} options={{ title: "Calendar" }} />
    </Stack.Navigator>
  );
}
