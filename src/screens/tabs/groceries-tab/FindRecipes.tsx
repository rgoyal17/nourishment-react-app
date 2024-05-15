import { Colors, Icon, useTheme, Image } from "@rneui/themed";
import React from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchRecipes, selectAllRecipes, selectRecipesByIds } from "../../../redux/recipesSlice";
import { MultiSelect } from "../../../common/MultiSelect";
import { compact } from "lodash";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";

type FindRecipesProps = StackScreenProps<GroceriesTabStackParamList, "FindRecipes">;

export function FindRecipes({ navigation }: FindRecipesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const recipes = useAppSelector(selectAllRecipes);

  const [selectedIngredients, setSelectedIngredients] = React.useState<{ title: string }[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const ingredientsToRecipeIds: Map<string, string[]> = React.useMemo(() => {
    const map = new Map<string, string[]>();
    recipes.forEach((recipe) => {
      recipe.ingredientsParsed.forEach((ingredient) => {
        const existingRecipeIds = map.get(ingredient.item) ?? [];
        map.set(ingredient.item, [...existingRecipeIds, recipe.id]);
      });
    });
    return map;
  }, [recipes]);

  const items = [...ingredientsToRecipeIds.keys()].map((ingredient) => ({ title: ingredient }));
  const selectedRecipeIds = compact(
    selectedIngredients.flatMap((ingredient) => ingredientsToRecipeIds.get(ingredient.title)),
  );
  const selectedRecipes = useAppSelector((state) => selectRecipesByIds(state, selectedRecipeIds));

  const onRefresh = async () => {
    setRefreshing(true);
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text>Find recipes by selecting ingredients:</Text>
      <MultiSelect
        items={items}
        searchInputLabel="Search ingredients..."
        selectedItems={selectedIngredients}
        selectInputLabel="Select ingredients..."
        submitButtonLabel="Done"
        onSelectItems={(items) => setSelectedIngredients(items)}
      />
      <FlatList
        data={selectedRecipes}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeItem}
            onPress={() =>
              navigation.navigate("RecipesTab", { screen: "RecipeItem", params: { recipe: item } })
            }
          >
            <View style={styles.recipe}>
              {item.image === "" ? (
                <View style={styles.noImage}>
                  <Icon name="photo" color={theme.colors.grey2} size={70} />
                </View>
              ) : (
                <Image
                  style={styles.image}
                  source={{ uri: item.image }}
                  PlaceholderContent={
                    <ActivityIndicator
                      style={styles.activityIndicator}
                      color={theme.colors.primary}
                    />
                  }
                />
              )}
              <Text numberOfLines={3} style={styles.title}>
                {item.title}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        numColumns={2}
        keyExtractor={(_, index) => `${index}`}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      padding: 15,
      rowGap: 10,
    },
    recipeItem: {
      flex: 1 / 2,
      margin: 10,
    },
    recipe: {
      borderColor: colors.white,
      borderWidth: 5,
      borderRadius: 20,
      backgroundColor: colors.white,
    },
    noImage: {
      height: 150,
      borderRadius: 20,
      backgroundColor: colors.disabled,
      justifyContent: "center",
    },
    image: {
      height: 150,
      borderRadius: 20,
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      padding: 5,
    },
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 20,
      height: "100%",
      width: "100%",
    },
  });
