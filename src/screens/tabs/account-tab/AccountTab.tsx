import { createStackNavigator } from "@react-navigation/stack";
import { Icon, useTheme } from "@rneui/themed";
import React from "react";
import { HEADER_HEIGHT } from "../../../common/constants";
import { AccountPage } from "./AccountPage";
import { EditAccountPage } from "./EditAccountPage";

export type AccountTabStackParamList = {
  AccountPage: undefined;
  EditAccountPage: undefined;
};

const Stack = createStackNavigator<AccountTabStackParamList>();

export function AccountTab() {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;

  return (
    <Stack.Navigator
      initialRouteName="AccountPage"
      screenOptions={{
        headerStyle: { backgroundColor: primary, height: HEADER_HEIGHT },
        headerBackTitleVisible: false,
        headerTintColor: secondary,
        headerBackImage: () => <Icon color={secondary} name="chevron-left" size={40} />,
      }}
    >
      <Stack.Screen name="AccountPage" component={AccountPage} options={{ title: "Account" }} />
      <Stack.Screen
        name="EditAccountPage"
        component={EditAccountPage}
        options={{ title: "Edit Account" }}
      />
    </Stack.Navigator>
  );
}
