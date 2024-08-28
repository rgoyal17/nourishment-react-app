import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, useTheme } from "@rneui/themed";
import { RecipesTab } from "../screens/tabs/recipes-tab/RecipesTab";
import { GroceriesTab } from "../screens/tabs/groceries-tab/GroceriesTab";
import { CalendarTab } from "../screens/tabs/calendar-tab/CalendarTab";
import { AccountTab } from "../screens/tabs/account-tab/AccountTab";
import { HEADER_HEIGHT } from "../common/constants";
import { fetchGroceries } from "../redux/groceriesSlice";
import { useAppDispatch } from "../redux/hooks";
import { fetchRecipes } from "../redux/recipesSlice";
import { fetchCalendarItems } from "../redux/calendarSlice";
import { fetchRecipeSortOption } from "../redux/recipeSortSlice";
import { useAuthContext } from "../contexts/AuthContext";
import { fetchUserProfile } from "../redux/userProfileSlice";
import { DiscoverTab } from "../screens/tabs/discover-tab/DiscoverTab";

export type UserStackParamList = {
  DiscoverTab: undefined;
  RecipesTab: undefined;
  CalendarTab: undefined;
  GroceriesTab: undefined;
  AccountTab: undefined;
};

const Tab = createBottomTabNavigator<UserStackParamList>();

export function UserStack() {
  const { theme } = useTheme();
  const { primary, secondary, grey2 } = theme.colors;
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
      dispatch(fetchRecipeSortOption(user.uid));
      dispatch(fetchCalendarItems(user.uid));
      dispatch(fetchGroceries(user.uid));
      dispatch(fetchUserProfile(user.uid));
    }
  }, [dispatch, user]);

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
            tabBarIcon: ({ focused }) => <Icon name="search" color={focused ? secondary : grey2} />,
            headerShown: false,
            title: "Discover",
          }}
          name="DiscoverTab"
          component={DiscoverTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="menu-book" color={focused ? secondary : grey2} />
            ),
            headerShown: false,
            title: "Recipes",
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
            title: "Calendar",
          }}
          name="CalendarTab"
          component={CalendarTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="shopping-basket" color={focused ? secondary : grey2} />
            ),
            headerShown: false,
            title: "Groceries",
          }}
          name="GroceriesTab"
          component={GroceriesTab}
        />
        <Tab.Screen
          options={{
            tabBarIcon: ({ focused }) => (
              <Icon name="user" type="font-awesome" color={focused ? secondary : grey2} />
            ),
            headerShown: false,
            title: "Account",
          }}
          name="AccountTab"
          component={AccountTab}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
