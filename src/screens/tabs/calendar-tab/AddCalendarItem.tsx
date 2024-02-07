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
import { addNewCalendarItem, fetchCalendarItems } from "../../../redux/calendarSlice";
import MultiSelect from "react-native-multiple-select";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { selectAllRecipes } from "../../../redux/recipesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import * as Sentry from "@sentry/react-native";

interface RecipeItem {
  id: string;
  name: string;
}

type AddCalendarItemProps = StackScreenProps<CalendarTabStackParamList, "AddCalendarItem">;

export function AddCalendarItem({ navigation }: AddCalendarItemProps) {
  const { theme } = useTheme();
  const { primary } = theme.colors;
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();

  const [date, setDate] = React.useState(new Date().toISOString());
  const [label, setLabel] = React.useState<string>();
  const [selectedRecipeIds, setSelectedRecipeIds] = React.useState<string[]>([]);
  const [isAddingCalendarItem, setIsAddingCalendarItem] = React.useState(false);

  const recipes = useAppSelector(selectAllRecipes);
  const recipeItems: RecipeItem[] = recipes.map((recipe) => ({
    name: recipe.title,
    id: recipe.id,
  }));

  const handleConfirmDate = React.useCallback(({ type }: DateTimePickerEvent, date?: Date) => {
    if (type === "set" && date != null) {
      setDate(date.toISOString());
    }
  }, []);

  const handleAddCalendarItem = React.useCallback(async () => {
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
      await dispatch(
        addNewCalendarItem({
          userId: user.uid,
          date,
          calendarItemData: label == null ? { recipeIds } : { label, recipeIds },
        }),
      );
      await dispatch(fetchCalendarItems(user.uid));
      navigation.navigate("CalendarItems");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add to calendar");
    } finally {
      setIsAddingCalendarItem(false);
    }
  }, [date, dispatch, label, navigation, selectedRecipeIds, user?.uid]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button title="Done" onPress={handleAddCalendarItem} loading={isAddingCalendarItem} />
      ),
    });
  }, [handleAddCalendarItem, isAddingCalendarItem, navigation]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.datetime}>
          <Text style={styles.key}>Date</Text>
          <RNDateTimePicker mode="date" value={new Date(date)} onChange={handleConfirmDate} />
        </View>
        <View>
          <View style={styles.label}>
            <Text style={styles.key}>Label</Text>
            <Text style={styles.subLabel}>(optional)</Text>
          </View>
          <TextInput
            placeholder="Add a label to group your recipes..."
            style={styles.input}
            value={label}
            onChangeText={(text) => setLabel(text)}
          />
        </View>
        <View style={styles.recipes}>
          <Text style={styles.key}>Recipes</Text>
          <MultiSelect
            items={recipeItems}
            selectedItems={selectedRecipeIds}
            onSelectedItemsChange={(items) => setSelectedRecipeIds(items)}
            selectText="Add recipes..."
            searchInputPlaceholderText="Search recipes..."
            uniqueKey="id"
            fixedHeight
            styleInputGroup={{ height: 35, paddingRight: 10 }}
            styleDropdownMenuSubsection={styles.selectorInput}
            styleTextDropdown={styles.selectText}
            styleTextDropdownSelected={styles.selectText}
            styleIndicator={{ display: "none" }}
            displayKey="name"
            selectedItemTextColor={primary}
            selectedItemIconColor={primary}
            submitButtonColor={primary}
            tagBorderColor={primary}
            tagTextColor={primary}
            submitButtonText="Select"
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
    subLabel: {
      color: colors.grey3,
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
