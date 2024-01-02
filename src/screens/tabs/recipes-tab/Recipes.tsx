import { Colors, FAB } from "@rneui/base";
import { Text, Image, useTheme, Icon, BottomSheet, ListItem, Divider } from "@rneui/themed";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { StackScreenProps } from "@react-navigation/stack";
import { fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { ActivityIndicator } from "react-native";

type RecipesProps = StackScreenProps<RecipesTabStackParamList, "Recipes">;

export function Recipes({ navigation }: RecipesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const { user } = useAuthentication();

  const dispatch = useAppDispatch();

  const recipes = useAppSelector(selectAllRecipes);

  const [refreshing, setRefreshing] = React.useState(false);
  const [isAddBottomSheetVisible, setIsAddBottomSheetVisible] = React.useState(false);
  const [isImportBottomSheetVisible, setIsImportBottomSheetVisible] = React.useState(false);
  const [recipeUrl, setRecipeUrl] = React.useState("");

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

  const handleCreateFromScratch = React.useCallback(() => {
    setIsAddBottomSheetVisible(false);
    navigation.navigate("Add Recipe");
  }, [navigation]);

  const handleImportFromWeb = React.useCallback(() => {
    setIsAddBottomSheetVisible(false);
    setIsImportBottomSheetVisible(true);
  }, []);

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
      <FAB
        style={styles.fab}
        icon={{ name: "add", color: theme.colors.secondary }}
        color={theme.colors.primary}
        onPress={() => setIsAddBottomSheetVisible(true)}
      />

      <BottomSheet
        isVisible={isAddBottomSheetVisible}
        onBackdropPress={() => setIsAddBottomSheetVisible(false)}
      >
        <ListItem onPress={handleCreateFromScratch}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="create-outline" type="ionicon" />
            <ListItem.Title>Create from Scratch</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={{ paddingBottom: 40 }} onPress={handleImportFromWeb}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="download" type="feather" />
            <ListItem.Title>Import from web</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheet>

      <BottomSheet
        isVisible={isImportBottomSheetVisible}
        onBackdropPress={() => setIsImportBottomSheetVisible(false)}
      >
        <View style={styles.importBottomSheet}>
          <Text h4>Import Recipe</Text>
          <Divider />
          <TextInput
            style={styles.input}
            value={recipeUrl}
            placeholder="Paste recipe URL here"
            onChangeText={(url) => setRecipeUrl(url)}
          />
        </View>
      </BottomSheet>
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
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 20,
      height: "100%",
      width: "100%",
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
    },
    importBottomSheet: {
      backgroundColor: colors.white,
      padding: 20,
      display: "flex",
      rowGap: 10,
    },
    input: {
      height: 100,
    },
  });
