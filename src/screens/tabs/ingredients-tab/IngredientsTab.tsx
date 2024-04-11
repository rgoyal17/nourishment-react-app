import { Colors } from "@rneui/base";
import { ButtonGroup, CheckBox, useTheme } from "@rneui/themed";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { getFutureDates, getLocalDateString, getMonthDateString } from "../../../common/date";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  CalendarView,
  fetchCalendarItems,
  selectAllCalendarItems,
} from "../../../redux/calendarSlice";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useIngredientsByDate } from "../../../hooks/useIngredientsByDate";
import { ZeroState } from "../../../common/ZeroState";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { UserStackParamList } from "../../../navigation/UserStack";
import { MarkedDates } from "react-native-calendars/src/types";

type IngredientsTabProps = BottomTabScreenProps<UserStackParamList, "IngredientsTab">;

export function IngredientsTab({ navigation }: IngredientsTabProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary } = theme.colors;
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const calendarItems = useAppSelector(selectAllCalendarItems);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const [selectedDateString, setSelectedDateString] = React.useState(
    getLocalDateString(new Date()),
  );
  const [calendarView, setCalendarView] = React.useState<CalendarView>(CalendarView.WEEK);
  const [checkedIngredients, setCheckedIngredients] = React.useState<string[]>([]);

  const buttons = React.useMemo(
    () => Object.keys(CalendarView).filter((item) => isNaN(Number(item))),
    [],
  );

  const selectedDateObj = React.useMemo(
    () => new Date(selectedDateString + "T00:00:00"),
    [selectedDateString],
  );

  const { weekDateObj, monthDateObj } = getFutureDates(selectedDateObj);

  const ingredients = useIngredientsByDate(selectedDateString, calendarView);

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

  const calendarViewText = React.useMemo(() => {
    if (calendarView === CalendarView.DAY) {
      return `on ${getMonthDateString(selectedDateObj)}`;
    } else if (calendarView === CalendarView.WEEK) {
      return `from ${getMonthDateString(selectedDateObj)} to ${getMonthDateString(weekDateObj)}`;
    } else {
      return `from ${getMonthDateString(selectedDateObj)} to ${getMonthDateString(monthDateObj)}`;
    }
  }, [calendarView, monthDateObj, selectedDateObj, weekDateObj]);

  const markedDates = React.useMemo(() => {
    const dates: MarkedDates = {};
    calendarItems.forEach((item) => {
      if (!Object.keys(dates).includes(item.date)) {
        dates[item.date] = { marked: true };
      }
    });
    return dates;
  }, [calendarItems]);

  return (
    <View style={styles.container}>
      <CalendarProvider date={selectedDateString} theme={{ todayButtonTextColor: primary }}>
        <ExpandableCalendar
          date={selectedDateString}
          firstDay={1}
          markedDates={markedDates}
          onDayPress={(dateData) => setSelectedDateString(dateData.dateString)}
          theme={{
            todayDotColor: primary,
            indicatorColor: primary,
            selectedDotColor: primary,
            arrowColor: primary,
            selectedDayBackgroundColor: primary,
            todayTextColor: primary,
          }}
        />
        <ButtonGroup
          buttons={buttons}
          selectedIndex={calendarView}
          onPress={(value) => setCalendarView(value)}
        />
        <Text
          style={styles.text}
        >{`Ingredients for recipes in calendar ${calendarViewText}:`}</Text>
        <ScrollView>
          {ingredients.length === 0 ? (
            <ZeroState
              imgSrc={require("../../../../assets/ingredients.png")}
              imgStyle={styles.zeroStateImg}
              title="No Recipes Found"
              subtitle="Add some recipes on your selected dates to view a list of ingredients here"
              actionButtonProps={{
                title: "Go to Calendar",
                onPress: () => navigation.navigate("CalendarTab"),
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
                <Text style={styles.rightText}>
                  {ingredient.quantity} {ingredient.unit}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </CalendarProvider>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
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
  });
