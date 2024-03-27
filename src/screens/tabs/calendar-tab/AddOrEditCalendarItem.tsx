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
import MultiSelect from "react-native-multiple-select";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { selectAllRecipes } from "../../../redux/recipesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import * as Sentry from "@sentry/react-native";
import { getLocalDateString } from "../../../common/date";

interface RecipeItem {
  id: string;
  name: string;
}

type AddOrEditCalendarItemProps = StackScreenProps<
  CalendarTabStackParamList,
  "AddOrEditCalendarItem"
>;

export function AddOrEditCalendarItem({ navigation, route }: AddOrEditCalendarItemProps) {
  const { theme } = useTheme();
  const { primary } = theme.colors;
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const editItem = route.params.editItem;

  const [date, setDate] = React.useState(new Date());
  const [label, setLabel] = React.useState<string | undefined>(editItem?.calendarItemData.label);
  const [selectedRecipeIds, setSelectedRecipeIds] = React.useState<string[]>(
    editItem?.calendarItemData.recipeIds ?? [],
  );
  const [isAddingCalendarItem, setIsAddingCalendarItem] = React.useState(false);

  const recipes = useAppSelector(selectAllRecipes);
  const recipeItems: RecipeItem[] = recipes.map((recipe) => ({
    name: recipe.title,
    id: recipe.id,
  }));

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
    if (selectedRecipeIds.length === 0) {
      Alert.alert("Please select recipes");
      return;
    }
    setIsAddingCalendarItem(true);
    try {
      const recipeIds = selectedRecipeIds;
      if (editItem != null) {
        await dispatch(
          editCalendarItem({
            userId: user.uid,
            date: editItem.date,
            prevData: editItem.calendarItemData,
            newData: { label, recipeIds },
          }),
        );
      } else {
        await dispatch(
          addNewCalendarItem({
            userId: user.uid,
            date: getLocalDateString(date),
            recipeData: label == null ? { recipeIds } : { label, recipeIds },
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
  }, [date, dispatch, editItem, label, navigation, selectedRecipeIds, user?.uid]);

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
            displayKey="name"
            fixedHeight={true}
            items={recipeItems}
            onSelectedItemsChange={(items) => setSelectedRecipeIds(items)}
            searchInputPlaceholderText="Search recipes..."
            selectedItemIconColor={primary}
            selectedItems={selectedRecipeIds}
            selectedItemTextColor={primary}
            selectText="Add recipes for this date..."
            styleDropdownMenuSubsection={styles.selectorInput}
            styleIndicator={{ display: "none" }}
            styleInputGroup={{ height: 35, paddingRight: 10 }}
            styleTextDropdown={styles.selectText}
            styleTextDropdownSelected={styles.selectText}
            submitButtonColor={primary}
            submitButtonText="Select"
            tagBorderColor={primary}
            tagTextColor={primary}
            uniqueKey="id"
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
