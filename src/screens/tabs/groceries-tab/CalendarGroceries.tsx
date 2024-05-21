import { Colors } from "@rneui/base";
import { Button, Icon, useTheme } from "@rneui/themed";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { getDatesInRange, getMonthDateString } from "../../../common/date";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchCalendarItems, selectAllCalendarItems } from "../../../redux/calendarSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { ZeroState } from "../../../common/ZeroState";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { fetchRecipes, selectAllRecipes } from "../../../redux/recipesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import {
  GroceryItem,
  addGroceryItems,
  fetchGroceries,
  selectGroceriesState,
} from "../../../redux/groceriesSlice";
import { compact } from "lodash";
import * as Sentry from "@sentry/react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { GroceriesList } from "./GroceriesList";
import { combineIngredients } from "../../../common/combineIngredients";
import { BottomSheetList } from "../../../common/BottomSheetList";

type CalendarGroceriesProps = StackScreenProps<GroceriesTabStackParamList, "CalendarGroceries">;

export function CalendarGroceries({ navigation }: CalendarGroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const groceriesState = useAppSelector(selectGroceriesState);
  const allCalendarItems = useAppSelector(selectAllCalendarItems);
  const allRecipes = useAppSelector(selectAllRecipes);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [isLoading, setIsLoading] = React.useState(false);

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ["18%"], []);

  const [groceryItems, setGroceryItems] = React.useState<GroceryItem[]>([]);

  // when start or end date is updated, we need to update the groceryItems state.
  React.useEffect(() => {
    const dates = getDatesInRange(startDate, endDate);
    const calendarItems = allCalendarItems.filter((item) => dates.includes(item.date));
    const recipeIds = calendarItems.flatMap(
      (item) => item.recipeData.flatMap((data) => data.recipeIds) ?? [],
    );
    const recipes = compact(recipeIds.map((id) => allRecipes.find((recipe) => recipe.id === id)));
    const allIngredients = recipes.flatMap((recipe) => recipe.ingredientsParsed);
    setGroceryItems(
      combineIngredients(allIngredients).map((i) => ({
        ...i,
        isChecked: true,
      })),
    );
  }, [startDate, endDate, allCalendarItems, allRecipes]);

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

  const handleCheckChange = React.useCallback((updatedItem: string) => {
    setGroceryItems((prev) =>
      prev.map((i) => (i.item === updatedItem ? { ...i, isChecked: !i.isChecked } : i)),
    );
  }, []);

  const handleSelectDate =
    (startOrEnd: "start" | "end") =>
    ({ type }: DateTimePickerEvent, date?: Date) => {
      if (type === "set" && date != null) {
        if (startOrEnd === "start") {
          setStartDate(date);
        } else {
          setEndDate(date);
        }
      }
    };

  const addSelectedItemsToGroceries = React.useCallback(async () => {
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

  const handleRefresh = React.useCallback(async () => {
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
      await dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const isAtLeastOneChecked = React.useMemo(
    () => groceryItems.some((i) => i.isChecked),
    [groceryItems],
  );

  return (
    <View style={styles.container}>
      <View style={styles.datePickers}>
        <View style={styles.picker}>
          <Text style={styles.pickerText}>From</Text>
          <RNDateTimePicker mode="date" value={startDate} onChange={handleSelectDate("start")} />
        </View>
        <View style={styles.picker}>
          <Text style={styles.pickerText}>To</Text>
          <RNDateTimePicker mode="date" value={endDate} onChange={handleSelectDate("end")} />
        </View>
      </View>
      <Text
        style={styles.text}
      >{`Select ingredients from recipes in calendar from ${getMonthDateString(
        startDate,
      )} to ${getMonthDateString(endDate)}:`}</Text>
      {groceryItems.length === 0 ? (
        <ZeroState
          imgSrc={require("../../../../assets/groceries.png")}
          imgStyle={styles.zeroStateImg}
          title="No Recipes Found"
          subtitle="Add some recipes on your selected dates to view a list of ingredients here"
          actionButtonProps={{
            title: "Go to Calendar",
            onPress: () =>
              navigation.navigate("CalendarTab", { screen: "CalendarPage", params: {} }),
          }}
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
          onPress={addSelectedItemsToGroceries}
        />
      ) : null}

      <BottomSheetList
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        modalItems={[
          {
            iconProps: { name: "check", type: "entypo" },
            title: "Select all",
            onPress: handleSelectAll,
          },
          {
            iconProps: { name: "cross", type: "entypo" },
            title: "Deselect all",
            onPress: handleDeselectAll,
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
      justifyContent: "center",
    },
    datePickers: {
      paddingHorizontal: 10,
      paddingVertical: 15,
      rowGap: 10,
    },
    picker: {
      rowGap: 5,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pickerText: {
      fontSize: 15,
      fontWeight: "500",
    },
    text: {
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    zeroStateImg: {
      opacity: 0.6,
      marginTop: -20,
      height: 170,
      width: 170,
    },
    doneButton: {
      borderRadius: 10,
      marginBottom: 10,
      width: 300,
    },
  });
