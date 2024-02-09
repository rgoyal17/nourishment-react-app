import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, useTheme } from "@rneui/themed";
import { RecipesTab } from "../screens/tabs/recipes-tab/RecipesTab";
import { IngredientsTab } from "../screens/tabs/ingredients-tab/IngredientsTab";
import { CalendarTab } from "../screens/tabs/calendar-tab/CalendarTab";
import { AccountTab } from "../screens/tabs/account-tab/AccountTab";
import { HEADER_HEIGHT } from "../common/constants";

const Tab = createBottomTabNavigator();

export function UserStack() {
  const { theme } = useTheme();
  const { primary, secondary, grey2 } = theme.colors;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: primary },
          tabBarActiveTintColor: secondary,
          tabBarInactiveTintColor: grey2,
          headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
          headerTintColor: secondary,
        }}
      >
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="menu-book" color={focused ? secondary : grey2} />
            ),
            headerShown: false,
          }}
          name="RecipesTab"
          component={RecipesTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="calendar" type="font-awesome" color={focused ? secondary : grey2} />
            ),
            headerShown: false,
          }}
          name="Calendar"
          component={CalendarTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="shopping-basket" color={focused ? secondary : grey2} />
            ),
          }}
          name="Ingredients"
          component={IngredientsTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="user" type="font-awesome" color={focused ? secondary : grey2} />
            ),
          }}
          name="Account"
          component={AccountTab}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
