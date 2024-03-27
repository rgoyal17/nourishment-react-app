import { StackScreenProps } from "@react-navigation/stack";
import { Colors, FAB, useTheme } from "@rneui/themed";
import React from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { AgendaList, CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  CalendarItem,
  CalendarItemData,
  fetchCalendarItems,
  selectAllCalendarItems,
} from "../../../redux/calendarSlice";
import { MemoizedCalendarDayItem } from "./CalendarDayItem";
import { Recipe } from "../../../redux/recipesSlice";
import { getLocalDateString } from "../../../common/date";
import { ZeroState } from "../../../common/ZeroState";

type CalendarItemsProps = StackScreenProps<CalendarTabStackParamList, "CalendarPage">;

export function CalendarPage({ navigation }: CalendarItemsProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary } = theme.colors;
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();

  const [selectedDate, setSelectedDate] = React.useState(getLocalDateString(new Date()));
  const [refreshing, setRefreshing] = React.useState(false);

  const calendarItems = useAppSelector(selectAllCalendarItems);

  const agendaItems = React.useMemo(
    () => calendarItems.map((item) => ({ title: item.date, data: [item] })),
    [calendarItems],
  );

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
      navigation.navigate("RecipesTab", { screen: "RecipeItem", params: { recipe } }),
    [navigation],
  );

  const handleEditCalendarItem = React.useCallback(
    (calendarItemData: CalendarItemData, date: string) =>
      navigation.navigate("AddOrEditCalendarItem", { editItem: { calendarItemData, date } }),
    [navigation],
  );

  const renderItem = React.useCallback(
    ({ item }: any) => (
      <MemoizedCalendarDayItem
        calendarItem={item as CalendarItem}
        onEditRecipe={handleEditCalendarItem}
        onNavigateToRecipe={handleNavigateToRecipe}
      />
    ),
    [handleEditCalendarItem, handleNavigateToRecipe],
  );

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchCalendarItems(user.uid));
    }
  }, [dispatch, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user != null) {
      await dispatch(fetchCalendarItems(user.uid));
    }
    setRefreshing(false);
  };

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
        {agendaItems.length > 0 ? (
          <AgendaList
            sectionStyle={styles.agendaSectionStyle}
            sections={agendaItems}
            renderItem={renderItem}
            scrollToNextEvent
            refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />}
          />
        ) : (
          <ZeroState
            imgSrc={require("../../../../assets/calendar.png")}
            imgStyle={styles.zeroStateImg}
            title="No Recipes Found"
            subtitle="Streamline your meals, one prep at a time"
            actionButtonProps={{
              title: "Add recipes to calendar",
              onPress: () => navigation.navigate("AddOrEditCalendarItem", {}),
            }}
          />
        )}
      </CalendarProvider>
      {agendaItems.length > 0 ? (
        <FAB
          style={styles.fab}
          icon={{ name: "add", color: theme.colors.secondary }}
          color={theme.colors.primary}
          onPress={() => navigation.navigate("AddOrEditCalendarItem", {})}
        />
      ) : null}
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
