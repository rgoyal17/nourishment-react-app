import { StackScreenProps } from "@react-navigation/stack";
import { Colors, FAB, useTheme } from "@rneui/themed";
import React from "react";
import { StyleSheet, View } from "react-native";
import { CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  CalendarItemData,
  fetchCalendarItems,
  selectAllCalendarItems,
  selectCalendarItemsByDate,
} from "../../../redux/calendarSlice";
import { MemoizedCalendarDayItem } from "./CalendarDayItem";
import { Recipe } from "../../../redux/recipesSlice";
import { getLocalDateString } from "../../../common/date";
import { ZeroState } from "../../../common/ZeroState";
import { useAuthContext } from "../../../contexts/AuthContext";

type CalendarItemsProps = StackScreenProps<CalendarTabStackParamList, "CalendarPage">;

export function CalendarPage({ navigation }: CalendarItemsProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary } = theme.colors;
  const { user } = useAuthContext();
  const dispatch = useAppDispatch();

  const [selectedDate, setSelectedDate] = React.useState(getLocalDateString(new Date()));

  const calendarItems = useAppSelector(selectAllCalendarItems);
  const calendarItem = useAppSelector(selectCalendarItemsByDate(selectedDate));

  const markedDates = React.useMemo(() => {
    const dates: MarkedDates = {};
    calendarItems.forEach((item) => {
      if (!Object.keys(dates).includes(item.date)) {
        dates[item.date] = { marked: true };
      }
    });
    return dates;
  }, [calendarItems]);

  const handleNavigateToRecipe = React.useCallback(
    (recipe: Recipe) =>
      navigation.navigate("RecipesTab", { screen: "RecipeItem", params: { recipeId: recipe.id } }),
    [navigation],
  );

  const handleEditCalendarItem = React.useCallback(
    (calendarItemData: CalendarItemData, date: string) =>
      navigation.navigate("AddOrEditCalendarItem", {
        editItem: { calendarItemData, date },
        initialDate: selectedDate,
      }),
    [navigation, selectedDate],
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
        onDateChanged={(d) => setSelectedDate(d)}
      >
        <ExpandableCalendar
          firstDay={1}
          markedDates={markedDates}
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
        {calendarItem != null ? (
          <MemoizedCalendarDayItem
            calendarItem={calendarItem}
            onEditRecipe={handleEditCalendarItem}
            onNavigateToRecipe={handleNavigateToRecipe}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.colors.secondary }}>
            <ZeroState
              imgSrc={require("../../../../assets/calendar.png")}
              imgStyle={styles.zeroStateImg}
              title="No Recipes Found"
              subtitle="Streamline your meals, one prep at a time"
              actionButtonProps={{
                title: "Add recipes to calendar",
                onPress: () =>
                  navigation.navigate("AddOrEditCalendarItem", { initialDate: selectedDate }),
              }}
            />
          </View>
        )}
      </CalendarProvider>
      {calendarItem != null ? (
        <FAB
          style={styles.fab}
          icon={{ name: "add", color: theme.colors.secondary }}
          color={theme.colors.primary}
          onPress={() =>
            navigation.navigate("AddOrEditCalendarItem", { initialDate: selectedDate })
          }
        />
      ) : null}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
    },
    agendaSectionStyle: {
      paddingBottom: 0,
    },
    emptyView: {
      alignItems: "center",
      rowGap: 20,
      flex: 1,
      justifyContent: "center",
    },
    emptyViewButton: {
      width: 300,
      borderRadius: 10,
    },
    zeroStateImg: {
      height: 250,
      width: 250,
      opacity: 0.6,
      marginTop: -30, // there is a lot of extra space on the image
    },
  });
