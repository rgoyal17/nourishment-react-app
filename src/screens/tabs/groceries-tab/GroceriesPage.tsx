import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import { View, StyleSheet } from "react-native";
import { Button, Colors, FAB, Icon, useTheme } from "@rneui/themed";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  GroceryItem,
  fetchGroceries,
  selectGroceriesState,
  setGroceryItems,
  updateGroceryItems,
} from "../../../redux/groceriesSlice";
import { ZeroState } from "../../../common/ZeroState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { GroceriesList } from "./GroceriesList";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { BottomSheetList } from "../../../common/BottomSheetList";

type GroceriesProps = StackScreenProps<GroceriesTabStackParamList, "GroceriesPage">;

export function GroceriesPage({ navigation }: GroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const groceriesState = useAppSelector(selectGroceriesState);
  const groceries = groceriesState.groceryItems;

  const addBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const addSnapPoints = React.useMemo(() => ["25%"], []);
  const optionsBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const optionsSnapPoints = React.useMemo(() => ["30%"], []);

  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [isDeletingChecked, setIsDeletingChecked] = React.useState(false);
  const [isSelectingAll, setIsSelectingAll] = React.useState(false);
  const [isDeselectingAll, setIsDeselectingAll] = React.useState(false);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchGroceries(user.uid));
    }
  }, [dispatch, user]);

  React.useEffect(() => {
    if (user?.uid != null) {
      const db = getFirestore();
      const unsub = onSnapshot(doc(db, `users/${user.uid}`), (doc) => {
        const latestGroceries = (doc.data()?.groceries as GroceryItem[]) ?? [];
        dispatch(updateGroceryItems(latestGroceries));
      });
      return () => unsub();
    }
  }, [dispatch, user?.uid]);

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

  const handleSelectAll = React.useCallback(async () => {
    setIsSelectingAll(true);
    const updatedGroceries = groceries.map((existingItem) => ({
      ...existingItem,
      isChecked: true,
    }));
    if (user != null) {
      await dispatch(setGroceryItems({ userId: user.uid, groceryItems: updatedGroceries }));
    }
    setIsSelectingAll(false);
    optionsBottomSheetRef.current?.dismiss();
  }, [dispatch, groceries, user]);

  const handleDeselectAll = React.useCallback(async () => {
    setIsDeselectingAll(true);
    const updatedGroceries = groceries.map((existingItem) => ({
      ...existingItem,
      isChecked: false,
    }));
    if (user != null) {
      await dispatch(setGroceryItems({ userId: user.uid, groceryItems: updatedGroceries }));
    }
    setIsDeselectingAll(false);
    optionsBottomSheetRef.current?.dismiss();
  }, [dispatch, groceries, user]);

  const handleDeleteAll = React.useCallback(async () => {
    setIsDeletingAll(true);
    if (user != null) {
      await dispatch(setGroceryItems({ userId: user.uid, groceryItems: [] }));
    }
    optionsBottomSheetRef.current?.dismiss();
    setIsDeletingAll(false);
  }, [dispatch, user]);

  const handleDeleteCheckedItems = React.useCallback(async () => {
    setIsDeletingChecked(true);
    const updatedGroceries = groceries.filter((item) => !item.isChecked);
    if (user != null) {
      await dispatch(setGroceryItems({ userId: user.uid, groceryItems: updatedGroceries }));
    }
    optionsBottomSheetRef.current?.dismiss();
    setIsDeletingChecked(false);
  }, [dispatch, groceries, user]);

  const handleAddItem = React.useCallback(() => {
    addBottomSheetRef.current?.dismiss();
    navigation.navigate("AddGroceryItem");
  }, [navigation]);

  const handleImportFromRecipes = React.useCallback(() => {
    addBottomSheetRef.current?.dismiss();
    navigation.navigate("RecipeGroceries");
  }, [navigation]);

  const handleImportFromCalendar = React.useCallback(() => {
    addBottomSheetRef.current?.dismiss();
    navigation.navigate("CalendarGroceries");
  }, [navigation]);

  const handleRefresh = React.useCallback(async () => {
    if (user != null) {
      await dispatch(fetchGroceries(user.uid));
    }
  }, [dispatch, user]);

  const handleCheckChange = React.useCallback(
    async (changedItem: string) => {
      const updatedGroceries = groceries.map((existingItem) =>
        existingItem.item === changedItem
          ? { ...existingItem, isChecked: !existingItem.isChecked }
          : existingItem,
      );
      if (user != null) {
        await dispatch(setGroceryItems({ userId: user.uid, groceryItems: updatedGroceries }));
      }
    },
    [dispatch, groceries, user],
  );

  return (
    <View style={styles.container}>
      {groceries.length === 0 ? (
        <ZeroState
          imgSrc={require("../../../../assets/groceries.png")}
          imgStyle={styles.zeroStateImg}
          title="No Groceries Found"
          subtitle="Add some grocery items to view them here"
          actionButtonProps={{
            title: "Add Grocery Items",
            onPress: () => addBottomSheetRef.current?.present(),
          }}
        />
      ) : (
        <GroceriesList
          groceries={groceries}
          onCheckChange={handleCheckChange}
          onRefresh={handleRefresh}
        />
      )}

      {groceries.length > 0 ? (
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
            iconProps: { name: "add", type: "ionicon" },
            title: "Add new items",
            onPress: handleAddItem,
          },
          {
            iconProps: { name: "menu-book" },
            title: "Ingredients of recipes",
            onPress: handleImportFromRecipes,
          },
          {
            iconProps: { name: "calendar", type: "font-awesome" },
            title: "Meal prep calendar",
            onPress: handleImportFromCalendar,
          },
        ]}
      />

      <BottomSheetList
        ref={optionsBottomSheetRef}
        snapPoints={optionsSnapPoints}
        modalItems={[
          {
            iconProps: { name: "check", type: "entypo" },
            title: isSelectingAll ? "Selecting..." : "Select all",
            onPress: handleSelectAll,
          },
          {
            iconProps: { name: "cross", type: "entypo" },
            title: isDeselectingAll ? "Deselecting..." : "Deselect all",
            onPress: handleDeselectAll,
          },
          {
            iconProps: { name: "delete" },
            title: isDeletingAll ? "Deleting..." : "Delete all",
            onPress: handleDeleteAll,
          },
          {
            iconProps: { name: "remove-circle" },
            title: isDeletingChecked ? "Deleting..." : "Delete checked items",
            onPress: handleDeleteCheckedItems,
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
    zeroStateImg: {
      marginTop: -40,
      opacity: 0.6,
      height: 170,
      width: 170,
    },
  });
