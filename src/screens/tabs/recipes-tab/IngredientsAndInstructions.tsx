import { Text, View, StyleSheet } from "react-native";
import React from "react";
import { Button, Colors, useTheme } from "@rneui/themed";
import { Ingredient } from "../../../redux/recipesSlice";
import { uniq } from "lodash";
import { INGREDIENT_CATEGORIES } from "../../../common/constants";

interface IngredientsAndInstructionsProps {
  instructions: string[];
  isFormattedChecked: boolean;
  parsedIngredients: Ingredient[];
  rawIngredients: string[];
}

export function IngredientsAndInstructions({
  instructions,
  isFormattedChecked,
  parsedIngredients,
  rawIngredients,
}: IngredientsAndInstructionsProps) {
  const { theme } = useTheme();
  const { primary, secondary } = theme.colors;
  const styles = makeStyles(theme.colors);

  const [selectedTab, setSelectedTab] = React.useState(0);

  const ingredientCategories = uniq(parsedIngredients.map((i) => i.category)).sort(
    (a, b) => INGREDIENT_CATEGORIES.indexOf(a) - INGREDIENT_CATEGORIES.indexOf(b),
  );

  const mappedIngredients = new Map<string, Ingredient[]>();
  parsedIngredients.forEach((i) => {
    const category = i.category;
    const existingIngredients = mappedIngredients.get(category) ?? [];
    mappedIngredients.set(category, [...existingIngredients, i]);
  });

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
      <View>
        {selectedTab === 0 ? (
          isFormattedChecked ? (
            <View style={styles.parsedContainer}>
              {ingredientCategories.map((category, index) => (
                <View key={index}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View>
                    {mappedIngredients.get(category)?.map((ingredient, key) => (
                      <View style={styles.parsedIngredient} key={index + key}>
                        <View style={{ flex: 1 }}>
                          <Text>{ingredient.item}</Text>
                          {ingredient.notes.trim() !== "" ? (
                            <Text style={styles.notes}>{ingredient.notes}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.rightText}>
                          {ingredient.quantity} {ingredient.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            rawIngredients.map((ingredient, index) => (
              <View style={styles.ingredientContainer} key={index}>
                <Text style={styles.ingredient}>{ingredient}</Text>
              </View>
            ))
          )
        ) : (
          instructions.map((instruction, index) => (
            <View style={styles.instructionContainer} key={index}>
              <Text style={styles.index}>{index + 1}</Text>
              <Text style={styles.instruction}>{instruction}</Text>
            </View>
          ))
        )}
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
    parsedContainer: {
      rowGap: 20,
    },
    categoryTitle: {
      padding: 10,
      paddingBottom: 0,
      fontSize: 16,
      fontWeight: "500",
    },
    parsedIngredient: {
      paddingHorizontal: 10,
      paddingVertical: 13,
      borderBottomColor: colors.primary,
      borderBottomWidth: 0.2,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    notes: {
      fontSize: 10,
      color: colors.grey2,
    },
    ingredientContainer: {
      paddingHorizontal: 10,
      paddingVertical: 15,
      borderBottomColor: colors.primary,
      borderBottomWidth: 0.2,
      flexDirection: "row",
    },
    ingredient: {
      fontSize: 15,
      flex: 1,
    },
    rightText: {
      color: colors.grey2,
    },
    instructionContainer: {
      flexDirection: "row",
      columnGap: 10,
      paddingHorizontal: 10,
      paddingVertical: 15,
      borderBottomColor: colors.primary,
      borderBottomWidth: 0.2,
    },
    index: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.primary,
    },
    instruction: {
      fontSize: 17,
      flex: 1,
    },
  });
