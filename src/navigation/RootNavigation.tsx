import React from "react";
import { UserStack } from "./UserStack";
import { LoginScreen } from "../screens/auth-screens/LoginScreen";
import { useAuthContext } from "../contexts/AuthContext";

export function RootNavigation() {
  const { user } = useAuthContext();
  return user ? <UserStack /> : <LoginScreen />;
}
