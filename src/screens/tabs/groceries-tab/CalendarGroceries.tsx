import { Colors } from "@rneui/base";
import { Button, CheckBox, Icon, Tooltip, useTheme } from "@rneui/themed";
import React from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getMonthDateString } from "../../../common/date";
import { useAppDispatch } from "../../../redux/hooks";
import { fetchCalendarItems } from "../../../redux/calendarSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useIngredientsByDate } from "../../../hooks/useIngredientsByDate";
import { ZeroState } from "../../../common/ZeroState";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { fetchRecipes } from "../../../redux/recipesSlice";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import { addNewGroceryItem, fetchGroceries } from "../../../redux/groceriesSlice";
import { compact } from "lodash";
import * as Sentry from "@sentry/react-native";

type CalendarGroceriesProps = StackScreenProps<GroceriesTabStackParamList, "CalendarGroceries">;

export function CalendarGroceries({ navigation }: CalendarGroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [checkedIngredients, setCheckedIngredients] = React.useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorIngredient, setErrorIngredient] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const ingredients = useIngredientsByDate(startDate, endDate);

  const handleCheckChange = React.useCallback(
    (ingredientItem: string) => () => {
      setCheckedIngredients((prev) =>
        prev.includes(ingredientItem)
          ? [...prev].filter((i) => i !== ingredientItem)
          : [...prev, ingredientItem],
      );
    },
    [],
  );

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

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
      await dispatch(fetchCalendarItems(user.uid));
    }
    setIsRefreshing(false);
  }, [dispatch, user]);

  const addIngredientsToGroceries = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add a recipe");
      return;
    }
    try {
      setIsLoading(true);
      const checkedIngredientsObjs = compact(
        checkedIngredients.map((ingr) => ingredients.find((i) => i.item === ingr)),
      );
      for (const ingredient of checkedIngredientsObjs) {
        await dispatch(
          addNewGroceryItem({ userId: user.uid, groceryItem: { ...ingredient, isChecked: false } }),
        );
      }
      await dispatch(fetchGroceries(user.uid));
      navigation.navigate("GroceriesPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add grocery item");
    }
  }, [checkedIngredients, dispatch, ingredients, navigation, user?.uid]);

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
      <ScrollView
        refreshControl={<RefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
      >
        {ingredients.length === 0 ? (
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
          ingredients.map((ingredient, index) => (
            <View style={styles.ingredientContainer} key={index}>
              <CheckBox
                containerStyle={styles.checkbox}
                checked={checkedIngredients.includes(ingredient.item)}
                onPress={handleCheckChange(ingredient.item)}
              />
              <Text style={styles.ingredient}>{ingredient.item}</Text>
              {ingredient.error ? (
                <Tooltip
                  visible={errorIngredient === ingredient.item}
                  onOpen={() => setErrorIngredient(ingredient.item)}
                  onClose={() => setErrorIngredient(undefined)}
                  popover={<Text>Failed to add quantities</Text>}
                  width={180}
                  backgroundColor={theme.colors.white}
                >
                  <Icon style={{ opacity: 0.6 }} color={theme.colors.error} name="error" />
                </Tooltip>
              ) : (
                <Text style={styles.rightText}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
      <Button
        loading={isLoading}
        buttonStyle={styles.doneButton}
        title="Done"
        onPress={addIngredientsToGroceries}
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
    ingredientContainer: {
      paddingHorizontal: 10,
      paddingVertical: 15,
      borderBottomColor: colors.primary,
      borderBottomWidth: 0.2,
      flexDirection: "row",
      alignItems: "center",
    },
    checkbox: {
      padding: 0,
      margin: 0,
      backgroundColor: colors.secondary,
    },
    ingredient: {
      fontSize: 15,
      flex: 1,
    },
    rightText: {
      color: colors.grey2,
    },
    doneButton: {
      borderRadius: 10,
    },
  });
