import { StackScreenProps } from "@react-navigation/stack";
import { Button, Colors, FAB, Icon, useTheme } from "@rneui/themed";
import React from "react";
import { ActivityIndicator, RefreshControl, StyleSheet, View } from "react-native";
import { AgendaList, CalendarProvider, ExpandableCalendar } from "react-native-calendars";
import { DateData, MarkedDates } from "react-native-calendars/src/types";
import { CalendarTabStackParamList } from "./CalendarTab";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import {
  CalendarItem,
  CalendarItemData,
  fetchCalendarItems,
  selectCalendarState,
} from "../../../redux/calendarSlice";
import { MemoizedCalendarDayItem } from "./CalendarDayItem";
import { Recipe } from "../../../redux/recipesSlice";
import { getLocalDateString } from "../../../common/date";
import { ZeroState } from "../../../common/ZeroState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetList } from "../../../common/BottomSheetList";

type CalendarItemsProps = StackScreenProps<CalendarTabStackParamList, "CalendarPage">;

export function CalendarPage({ navigation }: CalendarItemsProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary, secondary } = theme.colors;
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();
  const calendarState = useAppSelector(selectCalendarState);
  const calendarItems = calendarState.calendarItems;
  const relevantCalendarItems = calendarItems.filter((item) => new Date(item.date) > new Date());

  const [selectedDate, setSelectedDate] = React.useState(getLocalDateString(new Date()));
  const [refreshing, setRefreshing] = React.useState(false);
  const [showPrevious, setShowPrevious] = React.useState(relevantCalendarItems.length === 0);

  const optionsBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const optionsSnapPoints = React.useMemo(() => ["12%"], []);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          icon={
            <Icon color={secondary} size={30} name="dots-horizontal" type="material-community" />
          }
          onPress={() => optionsBottomSheetRef.current?.present()}
        />
      ),
    });
  }, [navigation, secondary, theme.colors.secondary]);

  const agendaItems = React.useMemo(() => {
    const items = showPrevious ? calendarItems : relevantCalendarItems;
    return items.map((item) => ({ title: item.date, data: [item] }));
  }, [calendarItems, relevantCalendarItems, showPrevious]);

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

  const handleDatePress = React.useCallback((dateData: DateData) => {
    if (new Date(dateData.dateString) < new Date()) {
      setShowPrevious(true);
    }
    setSelectedDate(dateData.dateString);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user != null) {
      await dispatch(fetchCalendarItems(user.uid));
    }
    setRefreshing(false);
  };

  const handleToggleOld = React.useCallback(() => {
    optionsBottomSheetRef.current?.dismiss();
    setShowPrevious((prev) => !prev);
  }, []);

  if (calendarState.loading && calendarItems.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={{ flex: 1 }} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CalendarProvider
        date={selectedDate}
        showTodayButton={true}
        theme={{ todayButtonTextColor: primary }}
      >
        <ExpandableCalendar
          firstDay={1}
          markedDates={markedDates}
          onDayPress={handleDatePress}
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
            renderSectionHeader={() => null}
            sections={agendaItems}
            renderItem={renderItem}
            scrollToNextEvent={true}
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

      <BottomSheetList
        ref={optionsBottomSheetRef}
        snapPoints={optionsSnapPoints}
        modalItems={[
          {
            iconProps: { name: showPrevious ? "eye-with-line" : "eye", type: "entypo" },
            title: showPrevious ? "Hide older items" : "Show older items",
            onPress: handleToggleOld,
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
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
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
      marginTop: -30,
    },
  });
