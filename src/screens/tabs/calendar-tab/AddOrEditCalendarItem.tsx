import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import React from "react";
import { Button, Colors, useTheme } from "@rneui/themed";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  addNewCalendarItem,
  editCalendarItem,
  fetchCalendarItems,
} from "../../../redux/calendarSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Recipe, selectAllRecipes, selectRecipesByIds } from "../../../redux/recipesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { CalendarTabStackParamList } from "./CalendarTab";
import * as Sentry from "@sentry/react-native";
import { getLocalDateString } from "../../../common/date";
import { MultiSelect } from "../../../common/MultiSelect";
import { useAuthContext } from "../../../contexts/AuthContext";

type AddOrEditCalendarItemProps = StackScreenProps<
  CalendarTabStackParamList,
  "AddOrEditCalendarItem"
>;

export function AddOrEditCalendarItem({ navigation, route }: AddOrEditCalendarItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();
  const editItem = route.params.editItem;
  const recipeIds = editItem?.calendarItemData.recipeIds ?? [];
  const editItemRecipes = useAppSelector((state) => selectRecipesByIds(state, recipeIds));

  const [date, setDate] = React.useState(new Date(`${route.params.initialDate}T00:00:00`));
  const [label, setLabel] = React.useState<string | undefined>(editItem?.calendarItemData.label);
  const [selectedRecipes, setSelectedRecipes] = React.useState<Recipe[]>(editItemRecipes);
  const [isAddingCalendarItem, setIsAddingCalendarItem] = React.useState(false);

  const recipes = useAppSelector(selectAllRecipes);

  const handleConfirmDate = React.useCallback(({ type }: DateTimePickerEvent, date?: Date) => {
    if (type === "set" && date != null) {
      setDate(date);
    }
  }, []);

  const handleAddOrEditCalendarItem = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add to calendar");
      return;
    }
    if (selectedRecipes.length === 0) {
      Alert.alert("Please select recipes");
      return;
    }
    setIsAddingCalendarItem(true);
    try {
      const recipeIds = selectedRecipes.map((r) => r.id);
      if (editItem != null) {
        await dispatch(
          editCalendarItem({
            userId: user.uid,
            date: editItem.date,
            prevData: editItem.calendarItemData,
            newData:
              label == null || label.trim().length === 0 ? { recipeIds } : { label, recipeIds },
          }),
        );
      } else {
        await dispatch(
          addNewCalendarItem({
            userId: user.uid,
            date: getLocalDateString(date),
            recipeData:
              label == null || label.trim().length === 0 ? { recipeIds } : { label, recipeIds },
          }),
        );
      }
      await dispatch(fetchCalendarItems(user.uid));
      navigation.navigate("CalendarPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add to calendar");
    } finally {
      setIsAddingCalendarItem(false);
    }
  }, [date, dispatch, editItem, label, navigation, selectedRecipes, user?.uid]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Done" onPress={handleAddOrEditCalendarItem} loading={isAddingCalendarItem} />
      ),
      title: editItem != null ? "Edit Calendar Item" : "Add To Calendar",
    });
  }, [editItem, handleAddOrEditCalendarItem, isAddingCalendarItem, navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {editItem != null ? null : (
          <View style={styles.datetime}>
            <Text style={styles.key}>Date</Text>
            <RNDateTimePicker mode="date" value={new Date(date)} onChange={handleConfirmDate} />
          </View>
        )}
        <View>
          <View style={styles.label}>
            <Text style={styles.key}>Label</Text>
            <Text style={styles.optional}>(optional)</Text>
          </View>
          <Text style={styles.subLabel}>Group your recipes under a label. Ex: Breakfast.</Text>
          <TextInput
            placeholder="Add a label..."
            style={styles.input}
            value={label}
            onChangeText={(text) => setLabel(text)}
          />
        </View>
        <View style={styles.recipes}>
          <Text style={styles.key}>Recipes</Text>
          <MultiSelect
            items={recipes}
            searchInputLabel="Search recipes..."
            selectedItems={selectedRecipes}
            selectInputLabel="Select recipes..."
            submitButtonLabel="Done"
            onSelectItems={(items) => setSelectedRecipes(items)}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      padding: 20,
      rowGap: 10,
      backgroundColor: colors.secondary,
      height: "100%",
    },
    key: {
      fontSize: 15,
      fontWeight: "500",
    },
    datetime: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rightAlign: {
      alignSelf: "flex-end",
    },
    label: {
      flexDirection: "row",
      columnGap: 5,
      alignItems: "center",
      marginTop: 10,
    },
    optional: {
      color: colors.grey3,
    },
    subLabel: {
      fontSize: 12,
      color: colors.grey2,
      marginTop: 2,
    },
    recipes: {
      marginTop: 10,
      rowGap: 5,
    },
    error: {
      marginTop: 5,
      color: colors.error,
    },
    input: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 10,
      height: 35,
      marginTop: 5,
    },
    selectorInput: {
      height: 35,
      borderBottomWidth: 0,
      borderRadius: 10,
      padding: 10,
    },
    selectText: {
      color: colors.grey4,
      paddingLeft: 10,
    },
  });
