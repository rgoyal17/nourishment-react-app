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
import { UNIT } from "../../../common/constants";
import { TouchableOpacity } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
    setGroceryItems((existingItems) => [
      ...existingItems,
      { ...stagedGroceryItem, item: stagedGroceryItem.item.trim() },
    ]);
    setStagedGroceryItem(INITIAL_GROCERY_ITEM);
    setIsAdding(false);
  }, [stagedGroceryItem]);

  const handleDeleteStagedItem = React.useCallback(() => {
    setStagedGroceryItem(INITIAL_GROCERY_ITEM);
    setIsAdding(false);
  }, []);

  const handleEditItem = React.useCallback(
    (item: GroceryItem) => () => {
      setStagedGroceryItem(item);
      setGroceryItems((existingItems) => existingItems.filter((i) => i.item !== item.item));
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

  const units = ["-", ...Object.values(UNIT).filter((unit) => isNaN(Number(unit)))];

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        style={{ padding: 15 }}
        contentContainerStyle={{ rowGap: 10, paddingBottom: 40 }}
      >
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
            icon={<Icon name="add-circle" color={secondary} />}
            buttonStyle={styles.addButton}
            title="New item"
            onPress={() => setIsAdding(true)}
          />
        ) : (
          <View style={styles.newIngredient}>
            <TextInput
              autoFocus={true}
              style={{ ...styles.input, flex: 1 }}
              value={stagedGroceryItem.item}
              returnKeyType="done"
              placeholder="Name"
              onChangeText={(text: string) =>
                setStagedGroceryItem((existingItem) => ({ ...existingItem, item: text }))
              }
            />
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
                  style={{ ...styles.input, width: 110 }}
                  value={stagedGroceryItem.unit}
                  returnKeyType="done"
                  placeholder="Unit"
                  onChangeText={(unit: string) =>
                    setStagedGroceryItem((existingItem) => ({ ...existingItem, unit }))
                  }
                />
              </TouchableOpacity>
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
      </KeyboardAwareScrollView>
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
      marginLeft: "auto",
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
    addButton: {
      borderRadius: 10,
      justifyContent: "flex-start",
      columnGap: 10,
      width: 140,
    },
  });
