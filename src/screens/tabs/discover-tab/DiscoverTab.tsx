import React from "react";
import { View } from "react-native";
import Constants from "expo-constants";

export function DiscoverTab() {
  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const result = await fetch(
      `https://api.edamam.com/api/recipes/v2?type=public&diet=balanced&app_id=${Constants.expoConfig?.extra?.edamamAppId}&app_key=${Constants.expoConfig?.extra?.edamamAppKey}`,
    );
    console.log((await result.json()).hits[0].recipe.ingredients[0]);
  };

  return <View />;
}
