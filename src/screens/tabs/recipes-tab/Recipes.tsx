import { Colors, FAB } from "@rneui/base";
import { Text, Image, useTheme, Icon, ListItem, Divider, Button } from "@rneui/themed";
import React from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { StackScreenProps } from "@react-navigation/stack";
import { fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { ActivityIndicator } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { v4 as uuidv4 } from "uuid";
import { ZeroState } from "../../../common/ZeroState";

type RecipesProps = StackScreenProps<RecipesTabStackParamList, "Recipes">;

export function Recipes({ navigation }: RecipesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const { user } = useAuthentication();

  const dispatch = useAppDispatch();

  const recipes = useAppSelector(selectAllRecipes);

  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const addBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const addSnapPoints = React.useMemo(() => ["20%"], []);

  const importBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const importSnapPoints = React.useMemo(() => ["30%", "70%"], []);

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
    addBottomSheetRef.current?.dismiss();
    navigation.navigate("AddOrEditRecipe", { source: "scratch" });
  }, [navigation]);

  const handleImportFromWeb = React.useCallback(() => {
    addBottomSheetRef.current?.dismiss();
    importBottomSheetRef.current?.present();
  }, []);

  const handleImportClick = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nourishment-3c750.uc.r.appspot.com/getRecipe/${recipeUrl}`,
      );
      const recipe = await response.json();
      importBottomSheetRef.current?.dismiss();
      setRecipeUrl("");
      navigation.navigate("AddOrEditRecipe", {
        recipe: {
          id: uuidv4(),
          title: recipe.title ?? "",
          image: recipe.image ?? "",
          servings: recipe.yields?.charAt(0) ?? "",
          ingredientsRaw: recipe.ingredients ?? [],
          ingredientsParsed: [],
          instructions: recipe.instructions_list ?? [],
          cookTime: "",
          prepTime: "",
          websiteUrl: recipeUrl,
        },
        source: "import",
      });
    } catch {
      alert("Failed to import recipe");
    } finally {
      setLoading(false);
    }
  }, [navigation, recipeUrl]);

  return (
    <View style={styles.container}>
      {recipes.length > 0 ? (
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
      ) : (
        <ZeroState
          imgSrc={require("../../../../assets/recipe.png")}
          imgStyle={styles.zeroStateImg}
          title="No Recipes Found"
          subtitle="Spice up your app by adding some delicious recipes"
          actionButtonProps={{
            title: "Add Recipes",
            onPress: () => addBottomSheetRef.current?.present(),
          }}
        />
      )}

      {recipes.length > 0 ? (
        <FAB
          style={styles.fab}
          icon={{ name: "add", color: theme.colors.secondary }}
          color={theme.colors.primary}
          onPress={() => addBottomSheetRef.current?.present()}
        />
      ) : null}
      <BottomSheetModal
        enablePanDownToClose
        ref={addBottomSheetRef}
        snapPoints={addSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ListItem onPress={handleCreateFromScratch}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="create-outline" type="ionicon" />
            <ListItem.Title>Create from Scratch</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={handleImportFromWeb}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="download" type="feather" />
            <ListItem.Title>Import from web</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheetModal>

      <BottomSheetModal
        enablePanDownToClose
        ref={importBottomSheetRef}
        snapPoints={importSnapPoints}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={styles.importBottomSheet}>
          <Text style={{ alignSelf: "center" }} h4>
            Import Recipe
          </Text>
          <Divider />
          <BottomSheetTextInput
            value={recipeUrl}
            placeholder="Paste recipe URL here"
            onChangeText={(url) => setRecipeUrl(url)}
          />
          <Button
            title="Import"
            disabled={recipeUrl === ""}
            onPress={handleImportClick}
            loading={loading}
          />
        </View>
      </BottomSheetModal>
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
      rowGap: 20,
    },
    zeroStateImg: {
      marginTop: -100, // there is a lot of extra space on the image
      marginBottom: -10,
    },
  });
