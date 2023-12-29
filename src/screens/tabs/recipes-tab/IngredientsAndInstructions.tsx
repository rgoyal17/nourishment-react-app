import { Text, View, StyleSheet } from "react-native";
import React from "react";
import { Button, Colors, useTheme } from "@rneui/themed";

interface IngredientsAndInstructionsProps {
  ingredients: string[];
  instructions: string[];
}

export function IngredientsAndInstructions({
  ingredients,
  instructions,
}: IngredientsAndInstructionsProps) {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;
  const styles = makeStyles(theme.colors);

  const [selectedTab, setSelectedTab] = React.useState(0);

  return (
    <View>
      <View style={styles.tabButtons}>
        <Button
          containerStyle={styles.tabButton}
          buttonStyle={{ borderRadius: 0 }}
          onPress={() => setSelectedTab(0)}
          color={selectedTab === 0 ? primary : secondary}
          title="Ingredients"
          titleStyle={{ color: selectedTab === 0 ? secondary : primary }}
        />
        <Button
          containerStyle={styles.tabButton}
          buttonStyle={{ borderRadius: 0 }}
          onPress={() => setSelectedTab(1)}
          color={selectedTab === 1 ? primary : secondary}
          title="Instructions"
          titleStyle={{ color: selectedTab === 1 ? secondary : primary }}
        />
      </View>
      <View style={styles.tabContent}>
        {selectedTab === 0
          ? ingredients.map((ingredient, index) => <Text key={index}>{ingredient}</Text>)
          : instructions.map((instruction, index) => <Text key={index}>{instruction}</Text>)}
      </View>
    </View>
  );
}
const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    tabButtons: {
      display: "flex",
      flexDirection: "row",
      borderBottomColor: colors.primary,
      borderBottomWidth: 1,
    },
    tabButton: {
      flex: 1,
      borderRadius: 0,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },
    tabContent: {
      padding: 20,
      rowGap: 5,
    },
  });
