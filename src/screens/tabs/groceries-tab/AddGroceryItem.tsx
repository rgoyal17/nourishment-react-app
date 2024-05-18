import React from "react";
import { Button, Colors, Icon, useTheme } from "@rneui/themed";
import { View, StyleSheet, Alert, ScrollView, TextInput, Text } from "react-native";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  GroceryItem,
  addGroceryItems,
  fetchGroceries,
  selectGroceriesState,
} from "../../../redux/groceriesSlice";
import * as Sentry from "@sentry/react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { INGREDIENT_CATEGORIES, UNIT } from "../../../common/constants";
import { TouchableOpacity } from "react-native-gesture-handler";

type AddGroceryItemProps = StackScreenProps<GroceriesTabStackParamList, "AddGroceryItem">;

const INITIAL_GROCERY_ITEM: GroceryItem = {
  quantity: "",
  unit: "",
  item: "",
  notes: "",
  category: "",
  isChecked: false,
};

export function AddGroceryItem({ navigation }: AddGroceryItemProps) {
  const { theme } = useTheme();
  const { success, white, error, grey2, primary, secondary } = theme.colors;
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const groceriesState = useAppSelector(selectGroceriesState);

  const [groceryItems, setGroceryItems] = React.useState<GroceryItem[]>([]);
  const [stagedGroceryItem, setStagedGroceryItem] =
    React.useState<GroceryItem>(INITIAL_GROCERY_ITEM);

  const [isAdding, setIsAdding] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  const unitBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const unitSnapPoints = React.useMemo(() => ["45%"], []);
  const categoriesBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const categoriesSnapPoints = React.useMemo(() => ["45%"], []);

  const addItemsToGroceries = React.useCallback(async () => {
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
          groceryItems: groceryItems,
        }),
      );

      await dispatch(fetchGroceries(user.uid));
      navigation.navigate("GroceriesPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add grocery item");
    }
  }, [dispatch, groceriesState.groceryItems, groceryItems, navigation, user?.uid]);

  const handleConfirmStagedItem = React.useCallback(() => {
    setGroceryItems((existingItems) => [...existingItems, stagedGroceryItem]);
    setStagedGroceryItem(INITIAL_GROCERY_ITEM);
    setIsAdding(false);
  }, [stagedGroceryItem]);

  const handleDeleteStagedItem = React.useCallback(() => {
    setStagedGroceryItem(INITIAL_GROCERY_ITEM);
    setIsAdding(false);
  }, []);

  const handleEditItem = React.useCallback(
    (item: GroceryItem) => () => {
      setGroceryItems((existingItems) => existingItems.filter((i) => i.item !== item.item));
      setStagedGroceryItem(item);
      setIsAdding(true);
    },
    [],
  );

  const stagedItemExists = React.useMemo(
    () => groceryItems.some((i) => i.item === stagedGroceryItem.item),
    [groceryItems, stagedGroceryItem.item],
  );

  const handleSelectUnit = React.useCallback(
    (unit: string) => () => {
      unitBottomSheetRef.current?.dismiss();
      setStagedGroceryItem({ ...stagedGroceryItem, unit: unit === "-" ? "" : unit });
    },
    [stagedGroceryItem],
  );

  const handleSelectCategory = React.useCallback(
    (category: string) => () => {
      categoriesBottomSheetRef.current?.dismiss();
      setStagedGroceryItem({ ...stagedGroceryItem, category: category === "-" ? "" : category });
    },
    [stagedGroceryItem],
  );

  const units = ["-", ...Object.values(UNIT).filter((unit) => isNaN(Number(unit)))];
  const categories = ["-", ...INGREDIENT_CATEGORIES];

  return (
    <View style={styles.container}>
      <ScrollView style={{ padding: 15 }} contentContainerStyle={{ rowGap: 10, paddingBottom: 40 }}>
        {groceryItems.map((item, index) => (
          <View style={{ flexDirection: "row", alignItems: "center", columnGap: 5 }} key={index}>
            <Text style={{ flex: 1 }}>{item.item}</Text>
            <Text style={{ color: grey2 }}>{`${item.quantity} ${item.unit}`.trim()}</Text>
            <Button
              color={secondary}
              buttonStyle={styles.roundButton}
              icon={<Icon name="edit" color={primary} size={15} />}
              onPress={handleEditItem(item)}
            />
          </View>
        ))}
        {!isAdding ? (
          <Button
            buttonStyle={{ borderRadius: 10 }}
            title={groceryItems.length === 0 ? "Add an item" : "Add more items"}
            onPress={() => setIsAdding(true)}
          />
        ) : (
          <View style={styles.newIngredient}>
            <View style={styles.metadata}>
              <TextInput
                style={{ ...styles.input, width: 80 }}
                keyboardType="numeric"
                value={stagedGroceryItem.quantity}
                returnKeyType="done"
                placeholder="Quantity"
                onChangeText={(quantity: string) =>
                  setStagedGroceryItem((existingItem) => ({ ...existingItem, quantity }))
                }
              />
              <TouchableOpacity onPress={() => unitBottomSheetRef.current?.present()}>
                <TextInput
                  editable={false}
                  style={{ ...styles.input, width: 80 }}
                  value={stagedGroceryItem.unit}
                  returnKeyType="done"
                  placeholder="Unit"
                  onChangeText={(unit: string) =>
                    setStagedGroceryItem((existingItem) => ({ ...existingItem, unit }))
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => categoriesBottomSheetRef.current?.present()}
                containerStyle={{ flex: 1 }}
              >
                <TextInput
                  editable={false}
                  style={{ ...styles.input }}
                  value={stagedGroceryItem.category}
                  returnKeyType="done"
                  placeholder="Category"
                  onChangeText={(category: string) =>
                    setStagedGroceryItem((existingItem) => ({ ...existingItem, category }))
                  }
                />
              </TouchableOpacity>
            </View>
            <View style={styles.itemRow}>
              <TextInput
                style={{ ...styles.input, flex: 1 }}
                value={stagedGroceryItem.item}
                returnKeyType="done"
                placeholder="Name"
                onChangeText={(text: string) =>
                  setStagedGroceryItem((existingItem) => ({ ...existingItem, item: text }))
                }
              />
              <View style={styles.buttons}>
                <Button
                  buttonStyle={styles.roundButton}
                  color={success}
                  icon={<Icon name="check" type="font-awesome" color={white} size={15} />}
                  disabled={stagedGroceryItem.item.trim().length === 0 || stagedItemExists}
                  onPress={handleConfirmStagedItem}
                />
                <Button
                  buttonStyle={styles.roundButton}
                  color={error}
                  icon={<Icon name="delete" color={white} size={15} />}
                  onPress={handleDeleteStagedItem}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {groceryItems.length > 0 ? (
        <Button
          containerStyle={{ alignItems: "center" }}
          loading={isLoading}
          buttonStyle={styles.doneButton}
          title="Add to Grocery List"
          onPress={addItemsToGroceries}
        />
      ) : null}

      <BottomSheetModal
        enablePanDownToClose
        ref={unitBottomSheetRef}
        snapPoints={unitSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {units.map((unit, index) => (
            <TouchableOpacity
              style={{ paddingLeft: 15, padding: 7 }}
              key={index}
              onPress={handleSelectUnit(unit.toString())}
            >
              <Text style={{ fontSize: 15 }}>{unit}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheetModal>
      <BottomSheetModal
        enablePanDownToClose
        ref={categoriesBottomSheetRef}
        snapPoints={categoriesSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {categories.map((category, index) => (
            <TouchableOpacity
              style={{ paddingLeft: 15, padding: 7 }}
              key={index}
              onPress={handleSelectCategory(category)}
            >
              <Text style={{ fontSize: 15 }}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    newIngredient: {
      flexDirection: "column",
      rowGap: 5,
      justifyContent: "center",
    },
    metadata: {
      flexDirection: "row",
      columnGap: 5,
      alignItems: "center",
    },
    itemRow: {
      flexDirection: "row",
      columnGap: 15,
      alignItems: "center",
    },
    buttons: {
      flexDirection: "row",
      columnGap: 5,
      alignItems: "center",
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 10,
      height: 35,
    },
    roundButton: {
      paddingHorizontal: 0,
      borderRadius: 20,
      width: 32,
      height: 32,
    },
    doneButton: {
      borderRadius: 10,
      marginBottom: 10,
      width: 300,
    },
  });