import React from "react";
import { useAuthentication } from "../hooks/useAuthentication";
import { UserStack } from "./UserStack";
import { LoginScreen } from "../screens/auth-screens/LoginScreen";

export function RootNavigation() {
  const { user } = useAuthentication();

  return user ? <UserStack /> : <LoginScreen />;
}
