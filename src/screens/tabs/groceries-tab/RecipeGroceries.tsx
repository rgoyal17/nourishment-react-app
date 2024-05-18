import { Button, Colors, Icon, ListItem, useTheme } from "@rneui/themed";
import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Recipe, fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { MultiSelect } from "../../../common/MultiSelect";
import { combineIngredients } from "../../../common/combineIngredients";
import { GroceriesList } from "./GroceriesList";
import { ZeroState } from "../../../common/ZeroState";
import {
  GroceryItem,
  addGroceryItems,
  fetchGroceries,
  selectGroceriesState,
} from "../../../redux/groceriesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import * as Sentry from "@sentry/react-native";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

type RecipeGroceriesProps = StackScreenProps<GroceriesTabStackParamList, "RecipeGroceries">;

export function RecipeGroceries({ navigation }: RecipeGroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const recipes = useAppSelector(selectAllRecipes);
  const groceriesState = useAppSelector(selectGroceriesState);
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ["18%"], []);

  const [selectedRecipes, setSelectedRecipes] = React.useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const [groceryItems, setGroceryItems] = React.useState<GroceryItem[]>([]);

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
          onPress={() => bottomSheetRef.current?.present()}
        />
      ),
    });
  }, [navigation, theme.colors.secondary]);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
    }
  }, [dispatch, user]);

  const handleSelectRecipes = React.useCallback((items: Recipe[]) => {
    setSelectedRecipes(items);
    setGroceryItems(
      combineIngredients(items.flatMap((recipe) => recipe.ingredientsParsed)).map((i) => ({
        ...i,
        isChecked: true,
      })),
    );
  }, []);

  const handleRefresh = React.useCallback(async () => {
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
    }
  }, [dispatch, user]);

  const handleCheckChange = React.useCallback((updatedItem: string) => {
    setGroceryItems((prev) =>
      prev.map((i) => (i.item === updatedItem ? { ...i, isChecked: !i.isChecked } : i)),
    );
  }, []);

  const addIngredientsToGroceries = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add a recipe");
      return;
    }
    try {
      setIsLoading(true);

      await dispatch(
        addGroceryItems({
          userId: user.uid,
          existingGroceryItems: groceriesState.groceryItems,
          groceryItems: groceryItems
            .filter((i) => i.isChecked)
            .map((i) => ({ ...i, isChecked: false })),
        }),
      );

      await dispatch(fetchGroceries(user.uid));
      navigation.navigate("GroceriesPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add grocery item");
    }
  }, [dispatch, groceriesState.groceryItems, groceryItems, navigation, user?.uid]);

  const handleSelectAll = React.useCallback(() => {
    setGroceryItems((prev) => prev.map((i) => ({ ...i, isChecked: true })));
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleDeselectAll = React.useCallback(() => {
    setGroceryItems((prev) => prev.map((i) => ({ ...i, isChecked: false })));
    bottomSheetRef.current?.dismiss();
  }, []);

  const isAtLeastOneChecked = React.useMemo(
    () => groceryItems.some((i) => i.isChecked),
    [groceryItems],
  );

  return (
    <View style={styles.container}>
      <View style={styles.recipes}>
        <MultiSelect
          items={recipes}
          searchInputLabel="Search recipes..."
          selectedItems={selectedRecipes}
          selectInputLabel="Select recipes..."
          submitButtonLabel="Done"
          onSelectItems={handleSelectRecipes}
        />
      </View>
      {groceryItems.length === 0 ? (
        <ZeroState
          imgSrc={require("../../../../assets/groceries.png")}
          imgStyle={styles.zeroStateImg}
          title="No Ingredients Found"
          subtitle="Select some recipes to view a list of ingredients here"
        />
      ) : (
        <GroceriesList
          groceries={groceryItems}
          onCheckChange={handleCheckChange}
          onRefresh={handleRefresh}
        />
      )}
      {isAtLeastOneChecked ? (
        <Button
          containerStyle={{ alignItems: "center" }}
          loading={isLoading}
          buttonStyle={styles.doneButton}
          title="Add to Grocery List"
          onPress={addIngredientsToGroceries}
        />
      ) : null}

      <BottomSheetModal
        enablePanDownToClose
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ListItem onPress={handleSelectAll}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="check" type="entypo" />
            <ListItem.Title>Select all</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={handleDeselectAll}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="cross" type="entypo" />
            <ListItem.Title>Deselect all</ListItem.Title>
          </ListItem.Content>
        </ListItem>
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
    zeroStateImg: {
      opacity: 0.6,
      marginTop: -40,
      height: 170,
      width: 170,
    },
    recipes: {
      padding: 15,
      rowGap: 10,
    },
    recipesText: {
      fontSize: 15,
      fontWeight: "500",
    },
    doneButton: {
      borderRadius: 10,
      marginBottom: 10,
      width: 300,
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
    },
  });
