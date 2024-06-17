import React from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { CheckBox, Colors, Icon, Tooltip, useTheme } from "@rneui/themed";
import { GroceryItem } from "../../../redux/groceriesSlice";
import { uniq } from "lodash";
import { INGREDIENT_CATEGORIES } from "../../../common/constants";

interface GroceriesListProps {
  groceries: GroceryItem[];
  onCheckChange: (item: string) => void;
  onRefresh: () => Promise<void>;
}

export function GroceriesList({ groceries, onCheckChange, onRefresh }: GroceriesListProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorGroceryItem, setErrorGroceryItem] = React.useState<string>();

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }, [onRefresh]);

  const ingredientCategories = uniq(groceries.map((i) => i.category)).sort(
    (a, b) => INGREDIENT_CATEGORIES.indexOf(a) - INGREDIENT_CATEGORIES.indexOf(b),
  );

  const mappedIngredients = React.useMemo(() => {
    const map = new Map<string, GroceryItem[]>();
    groceries.forEach((i) => {
      const category = i.category;
      const existingIngredients = map.get(category) ?? [];
      map.set(category, i.isChecked ? [...existingIngredients, i] : [i, ...existingIngredients]);
    });
    return map;
  }, [groceries]);

  return (
    <ScrollView
      contentContainerStyle={{ rowGap: 20, padding: 15 }}
      refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
    >
      {ingredientCategories.map((category, index) => (
        <View key={index}>
          <Text style={category.length > 0 ? styles.categoryTitle : undefined}>{category}</Text>
          <View>
            {mappedIngredients.get(category)?.map((item, index) => (
              <View style={styles.itemContainer} key={index}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => onCheckChange(item.item)}
                >
                  <CheckBox containerStyle={styles.checkbox} checked={item.isChecked} />
                  <Text style={styles.item}>{item.item}</Text>
                </TouchableOpacity>
                {item.error ? (
                  <Tooltip
                    visible={errorGroceryItem === item.item}
                    onOpen={() => setErrorGroceryItem(item.item)}
                    onClose={() => setErrorGroceryItem(undefined)}
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
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    categoryTitle: {
      paddingTop: 10,
      paddingBottom: 0,
      fontSize: 16,
      fontWeight: "500",
    },
    itemContainer: {
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
