import { Colors } from "@rneui/base";
import { Button, Icon, ListItem, useTheme } from "@rneui/themed";
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { getMonthDateString } from "../../../common/date";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchCalendarItems } from "../../../redux/calendarSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useIngredientsByDate } from "../../../hooks/useIngredientsByDate";
import { ZeroState } from "../../../common/ZeroState";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { fetchRecipes } from "../../../redux/recipesSlice";
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
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { IngredientsList } from "./IngredientsList";

type CalendarGroceriesProps = StackScreenProps<GroceriesTabStackParamList, "CalendarGroceries">;

export function CalendarGroceries({ navigation }: CalendarGroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const groceriesState = useAppSelector(selectGroceriesState);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchRecipes(user.uid));
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [checkedIngredients, setCheckedIngredients] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ["18%"], []);

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

  const ingredients = useIngredientsByDate(startDate, endDate);

  const handleCheckChange = React.useCallback((updatedItem: string) => {
    setCheckedIngredients((prev) =>
      prev.includes(updatedItem)
        ? [...prev].filter((i) => i !== updatedItem)
        : [...prev, updatedItem],
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

  const addIngredientsToGroceries = React.useCallback(async () => {
    if (user?.uid == null) {
      Alert.alert("Please sign in to add a recipe");
      return;
    }
    try {
      setIsLoading(true);
      const checkedIngredientsObjs: GroceryItem[] = compact(
        checkedIngredients.map((ingr) => ingredients.find((i) => i.item === ingr)),
      ).map((ingr) => ({ ...ingr, isChecked: false }));

      await dispatch(
        addGroceryItems({
          userId: user.uid,
          existingGroceryItems: groceriesState.groceryItems,
          groceryItems: checkedIngredientsObjs,
        }),
      );

      await dispatch(fetchGroceries(user.uid));
      navigation.navigate("GroceriesPage");
    } catch (e) {
      Sentry.captureException(e);
      Alert.alert("Failed to add grocery item");
    }
  }, [
    checkedIngredients,
    dispatch,
    groceriesState.groceryItems,
    ingredients,
    navigation,
    user?.uid,
  ]);

  const handleSelectAll = React.useCallback(() => {
    const newCheckedIngredients = [...checkedIngredients];
    ingredients.forEach((ingr) => {
      if (!newCheckedIngredients.includes(ingr.item)) {
        newCheckedIngredients.push(ingr.item);
      }
    });
    setCheckedIngredients(newCheckedIngredients);
    bottomSheetRef.current?.dismiss();
  }, [checkedIngredients, ingredients]);

  const handleDeselectAll = React.useCallback(() => {
    setCheckedIngredients([]);
    bottomSheetRef.current?.dismiss();
  }, []);

  const handleRefresh = React.useCallback(async () => {
    if (user != null) {
      await dispatch(fetchRecipes(user.uid));
      await dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

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
        <IngredientsList
          ingredients={ingredients}
          checkedIngredients={checkedIngredients}
          onCheckChange={handleCheckChange}
          onRefresh={handleRefresh}
        />
      )}
      {checkedIngredients.length > 0 ? (
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
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
    },
  });
