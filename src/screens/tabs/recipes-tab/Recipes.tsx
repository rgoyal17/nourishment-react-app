import { Colors, FAB } from "@rneui/base";
import { Text, Image, useTheme, Icon, Divider, Button } from "@rneui/themed";
import React from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { StackScreenProps } from "@react-navigation/stack";
import { fetchRecipes, selectRecipesState } from "../../../redux/recipesSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { ActivityIndicator } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { v4 as uuidv4 } from "uuid";
import { ZeroState } from "../../../common/ZeroState";
import { SearchRow } from "./SearchRow";
import {
  SortOption,
  fetchRecipeSortOption,
  getRecipeSortOption,
  updateRecipeSortOption,
  updateRecipeSortState,
} from "../../../redux/recipeSortSlice";
import { BottomSheetList } from "../../../common/BottomSheetList";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { useAuthContext } from "../../../contexts/AuthContext";
import * as Sentry from "@sentry/react-native";

type RecipesProps = StackScreenProps<RecipesTabStackParamList, "Recipes">;

export function Recipes({ navigation }: RecipesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();
  const recipesState = useAppSelector(selectRecipesState);
  const recipes = recipesState.recipes;
  const sortOption = useAppSelector(getRecipeSortOption);

  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const addBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const addSnapPoints = React.useMemo(() => ["20%"], []);
  const optionsBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const optionsSnapPoints = React.useMemo(() => ["12%"], []);

  const importBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const importSnapPoints = React.useMemo(() => ["30%", "70%"], []);

  const [recipeUrl, setRecipeUrl] = React.useState("");
  const [searchText, setSearchText] = React.useState("");

  const filteredRecipes = React.useMemo(() => {
    if (searchText.trim().length > 0) {
      return recipes.filter((recipe) => recipe.title.includes(searchText));
    }
    return recipes;
  }, [recipes, searchText]);

  const sortedRecipes = React.useMemo(() => {
    if (sortOption === SortOption.Name) {
      return filteredRecipes;
    } else if (sortOption === SortOption.Newest) {
      return [...filteredRecipes].sort(
        (a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime(),
      );
    } else {
      return [...filteredRecipes].sort(
        (a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime(),
      );
    }
  }, [filteredRecipes, sortOption]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          icon={
            <Icon
              color={theme.colors.secondary}
              size={30}
              name="dots-horizontal"
              type="material-community"
            />
          }
          onPress={() => optionsBottomSheetRef.current?.present()}
        />
      ),
    });
  }, [navigation, theme.colors.secondary]);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
      dispatch(fetchRecipeSortOption(user.uid));
    }
  }, [dispatch, user]);

  React.useEffect(() => {
    if (user?.uid != null) {
      const db = getFirestore();
      const unsub = onSnapshot(doc(db, `users/${user.uid}`), (doc) => {
        const sortOption = doc.data()?.recipeSortOption as SortOption | undefined;
        dispatch(updateRecipeSortState(sortOption ?? SortOption.Name));
      });
      return () => unsub();
    }
  }, [dispatch, user?.uid]);

  const handleUpdateSortOption = React.useCallback(
    async (option: SortOption) => {
      if (user?.uid == null) {
        Alert.alert("Please sign in first");
        return;
      }
      await dispatch(updateRecipeSortOption({ userId: user.uid, sortOption: option }));
    },
    [dispatch, user?.uid],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
      await dispatch(fetchRecipeSortOption(user.uid));
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
          isoDate: new Date().toISOString(),
          isParsing: false,
          websiteUrl: recipeUrl,
        },
        source: "import",
      });
    } catch (e) {
      alert("Failed to import recipe");
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  }, [navigation, recipeUrl]);

  const handleFindRecipes = React.useCallback(() => {
    optionsBottomSheetRef.current?.dismiss();
    navigation.navigate("FindRecipes");
  }, [navigation]);

  if (recipesState.loading && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ flex: 1 }} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recipes.length > 6 ? (
        <SearchRow
          sortOption={sortOption}
          searchText={searchText}
          onChangeSearchText={(text) => setSearchText(text)}
          onSelectSortOption={(option) => handleUpdateSortOption(option)}
        />
      ) : null}
      {sortedRecipes.length > 0 ? (
        <FlatList
          data={sortedRecipes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeItem}
              onPress={() => navigation.navigate("RecipeItem", { recipeId: item.id })}
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
          keyExtractor={(r) => r.id}
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

      {sortedRecipes.length > 0 ? (
        <FAB
          style={styles.fab}
          icon={{ name: "add", color: theme.colors.secondary }}
          color={theme.colors.primary}
          onPress={() => addBottomSheetRef.current?.present()}
        />
      ) : null}

      <BottomSheetList
        ref={addBottomSheetRef}
        snapPoints={addSnapPoints}
        modalItems={[
          {
            iconProps: { name: "create-outline", type: "ionicon" },
            title: "Create from Scratch",
            onPress: handleCreateFromScratch,
          },
          {
            iconProps: { name: "download", type: "feather" },
            title: "Import from web",
            onPress: handleImportFromWeb,
          },
        ]}
      />

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
            returnKeyType="done"
            onSubmitEditing={handleImportClick}
          />
          <Button
            title="Import"
            disabled={recipeUrl === ""}
            onPress={handleImportClick}
            loading={loading}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetList
        ref={optionsBottomSheetRef}
        snapPoints={optionsSnapPoints}
        modalItems={[
          {
            iconProps: { name: "search" },
            title: "Find recipes from ingredients",
            onPress: handleFindRecipes,
          },
        ]}
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
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 20,
      height: "100%",
      width: "100%",
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
