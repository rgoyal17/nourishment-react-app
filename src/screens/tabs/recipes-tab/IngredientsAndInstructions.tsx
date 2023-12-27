import { SafeAreaView, ScrollView, Text, View } from "react-native";
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTheme } from "@rneui/themed";

export type RecipeItemTabStackParamList = {
  Ingredients: { ingredients: string[] };
  Instructions: { instructions: string[] };
};

const Tab = createMaterialTopTabNavigator<RecipeItemTabStackParamList>();

interface IngredientsAndInstructionsProps {
  ingredients: string[];
  instructions: string[];
}

export function IngredientsAndInstructions({
  ingredients,
  instructions,
}: IngredientsAndInstructionsProps) {
  const { theme } = useTheme();
  const { primary, secondary, grey2 } = theme.colors;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: primary },
        tabBarIndicatorStyle: { backgroundColor: secondary },
        tabBarActiveTintColor: secondary,
        tabBarInactiveTintColor: grey2,
      }}
    >
      <Tab.Screen name="Ingredients">
        {() => <IngredientsTab ingredients={ingredients} />}
      </Tab.Screen>

      <Tab.Screen name="Instructions">
        {() => <InstructionsTab instructions={instructions} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

interface IngredientsTabProps {
  ingredients: string[];
}

function IngredientsTab({ ingredients }: IngredientsTabProps) {
  return (
    <View>
      {ingredients.map((ingredient, index) => (
        <Text key={index}>{ingredient}</Text>
      ))}
    </View>
  );
}

interface InstructionsTabProps {
  instructions: string[];
}

function InstructionsTab({ instructions }: InstructionsTabProps) {
  return (
    <View>
      {instructions.map((instruction, index) => (
        <Text key={index}>{instruction}</Text>
      ))}
    </View>
  );
}
