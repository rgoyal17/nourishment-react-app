import { StackScreenProps } from "@react-navigation/stack";
import { Colors, FAB, useTheme } from "@rneui/themed";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AgendaList, CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  CalendarItemData,
  fetchCalendarItems,
  selectAllCalendarItems,
} from "../../../redux/calendarSlice";
import { MemoizedCalendarItem } from "./CalendarItem";
import { Recipe } from "../../../redux/recipesSlice";
import { getLocalDateString } from "../../../common/date";

type CalendarItemsProps = StackScreenProps<CalendarTabStackParamList, "CalendarItems">;

export function CalendarItems({ navigation }: CalendarItemsProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary } = theme.colors;
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();

  const [selectedDate, setSelectedDate] = React.useState(getLocalDateString(new Date()));

  const calendarItems = useAppSelector(selectAllCalendarItems);

  const markedDates = React.useMemo(() => {
    const dates: MarkedDates = {};
    calendarItems.forEach((item) => {
      if (!Object.keys(dates).includes(item.title)) {
        dates[item.title] = { marked: true };
      }
    });
    return dates;
  }, [calendarItems]);

  const handleNavigateToRecipe = React.useCallback(
    (recipe: Recipe) =>
      navigation.navigate("RecipesTab", { screen: "RecipeItem", params: { recipe } }),
    [navigation],
  );

  const renderItem = React.useCallback(
    ({ item }: any) => {
      return (
        <MemoizedCalendarItem
          data={item as CalendarItemData}
          onNavigateToRecipe={handleNavigateToRecipe}
        />
      );
    },
    [handleNavigateToRecipe],
  );

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  return (
    <View style={styles.container}>
      <CalendarProvider
        date={selectedDate}
        showTodayButton
        theme={{ todayButtonTextColor: primary }}
      >
        <ExpandableCalendar
          firstDay={1}
          markedDates={markedDates}
          onDayPress={(dateData) => setSelectedDate(dateData.dateString)}
          theme={{
            dotColor: primary,
            todayDotColor: primary,
            indicatorColor: primary,
            selectedDotColor: primary,
            arrowColor: primary,
            selectedDayBackgroundColor: primary,
            todayTextColor: primary,
          }}
        />
        <AgendaList
          sectionStyle={styles.agendaSectionStyle}
          sections={calendarItems}
          renderItem={renderItem}
          scrollToNextEvent
        />
      </CalendarProvider>
      <FAB
        style={styles.fab}
        icon={{ name: "add", color: theme.colors.secondary }}
        color={theme.colors.primary}
        onPress={() => navigation.navigate("AddCalendarItem")}
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
    agendaSectionStyle: {
      paddingBottom: 0,
    },
  });