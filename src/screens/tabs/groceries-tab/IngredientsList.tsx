import React from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CheckBox, Colors, Icon, Tooltip, useTheme } from "@rneui/themed";
import { Ingredient } from "../../../redux/recipesSlice";

interface IngredientsListProps {
  ingredients: Ingredient[];
  checkedIngredients: string[];
  onCheckChange: (item: string) => void;
  onRefresh: () => Promise<void>;
}

export function IngredientsList({
  ingredients,
  checkedIngredients,
  onCheckChange,
  onRefresh,
}: IngredientsListProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorIngredient, setErrorIngredient] = React.useState<string>();

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }, [onRefresh]);

  const isItemChecked = React.useCallback(
    (item: Ingredient) => checkedIngredients.includes(item.item),
    [checkedIngredients],
  );

  return (
    <ScrollView
      refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
    >
      {ingredients.map((item, index) => (
        <View style={styles.itemContainer} key={index}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={() => onCheckChange(item.item)}
          >
            <CheckBox containerStyle={styles.checkbox} checked={isItemChecked(item)} />
            <Text style={styles.item}>{item.item}</Text>
          </TouchableOpacity>
          {item.error ? (
            <Tooltip
              visible={errorIngredient === item.item}
              onOpen={() => setErrorIngredient(item.item)}
              onClose={() => setErrorIngredient(undefined)}
              popover={<Text>Failed to add quantities</Text>}
              width={180}
              backgroundColor={theme.colors.white}
            >
              <Icon style={{ opacity: 0.6 }} color={theme.colors.error} name="error" />
            </Tooltip>
          ) : (
            <Text style={styles.rightText}>
              {item.quantity} {item.unit}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    itemContainer: {
      paddingHorizontal: 10,
      paddingVertical: 15,
      borderBottomColor: colors.primary,
      borderBottomWidth: 0.2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    checkbox: {
      padding: 0,
      margin: 0,
      backgroundColor: colors.secondary,
    },
    item: {
      fontSize: 15,
    },
    rightText: {
      color: colors.grey2,
    },
  });
