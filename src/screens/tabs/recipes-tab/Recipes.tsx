import { Colors, FAB } from "@rneui/base";
import { Text, Image, useTheme, Icon } from "@rneui/themed";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { StackScreenProps } from "@react-navigation/stack";
import { fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useAuthentication } from "../../../hooks/useAuthentication";

type RecipesProps = StackScreenProps<RecipesTabStackParamList, "Recipes">;

export function Recipes({ navigation }: RecipesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const { user } = useAuthentication();

  const dispatch = useAppDispatch();

  const recipes = useAppSelector(selectAllRecipes);

  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recipeItem}
            onPress={() => navigation.navigate("RecipeItem", { recipe: item })}
          >
            <View style={styles.recipe}>
              {item.image.trim() === "" ? (
                <View style={styles.noImage}>
                  <Icon name="photo" color={theme.colors.grey2} size={70} />
                </View>
              ) : (
                <Image style={styles.image} source={{ uri: item.image }} />
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
      <FAB
        style={styles.fab}
        icon={{ name: "add", color: theme.colors.secondary }}
        color={theme.colors.primary}
        onPress={() => navigation.navigate("Add Recipe")}
      />
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
    },
    recipeItem: {
      flex: 1 / 2,
      marginVertical: 15,
      marginHorizontal: 10,
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
  });
