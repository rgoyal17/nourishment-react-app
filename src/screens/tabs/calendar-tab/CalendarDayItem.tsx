import { ActivityIndicator, View, StyleSheet, Text, Alert } from "react-native";
import { Button, Colors, Divider, Icon, Image, useTheme } from "@rneui/themed";
import React from "react";
import {
  CalendarItem,
  CalendarItemData,
  deleteCalendarItem,
  fetchCalendarItems,
} from "../../../redux/calendarSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { Recipe, selectRecipesByIds } from "../../../redux/recipesSlice";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuthentication } from "../../../hooks/useAuthentication";
import * as Sentry from "@sentry/react-native";

interface CalendarDayItemProps {
  calendarItem: CalendarItem;
  onEditRecipe: (calendarItemData: CalendarItemData, date: string) => void;
  onNavigateToRecipe: (recipe: Recipe) => void;
}

function CalendarDayItem({ calendarItem, onEditRecipe, onNavigateToRecipe }: CalendarDayItemProps) {
  const { theme } = useTheme();
  const { primary, secondary, error, white, disabled, grey3, grey4 } = theme.colors;
  const styles = makeStyles(theme.colors);
  const dispatch = useAppDispatch();
  const { user } = useAuthentication();

  const [isDeletingIndex, setIsDeletingIndex] = React.useState(-1);

  const { date, recipeData } = calendarItem;
  const dateObj = new Date(`${date}T00:00:00`);
  const isOld = dateObj < new Date();

  const handleDeleteCalendarRecipeData = React.useCallback(
    (index: number, label?: string) => async () => {
      if (user?.uid != null) {
        try {
          setIsDeletingIndex(index);
          await dispatch(deleteCalendarItem({ userId: user.uid, date, label }));
          await dispatch(fetchCalendarItems(user.uid));
          setIsDeletingIndex(-1);
        } catch (e) {
          Sentry.captureException(e);
        }
      }
    },
    [date, dispatch, user?.uid],
  );

  const handleDeleteClick = React.useCallback(
    (index: number, label?: string) => async () => {
      Alert.alert("Are you sure you want to delete this calendar item?", undefined, [
        { text: "Cancel" },
        {
          text: "Delete",
          onPress: handleDeleteCalendarRecipeData(index, label),
          style: "destructive",
        },
      ]);
    },
    [handleDeleteCalendarRecipeData],
  );

  const handleEditCalendarItem = React.useCallback(
    (index: number) => () => onEditRecipe(recipeData[index], date),
    [onEditRecipe, recipeData, date],
  );

  return (
    <View style={{ ...styles.container, backgroundColor: isOld ? disabled : white }}>
      <Text
        style={styles.dateText}
      >{`${dateObj.toLocaleDateString("default", { weekday: "long" })}, ${dateObj.toLocaleDateString("default", { month: "short" })} ${dateObj.getDate()}`}</Text>
      {recipeData.map((data, index) => (
        <View key={index}>
          <View style={index === 0 ? styles.labelDivider : undefined}>
            {data.label != null ? (
              <Text style={{ ...styles.label, color: isOld ? grey3 : primary }}>{data.label}</Text>
            ) : null}
            {data.label != null || index !== 0 ? (
              <Divider color={isOld ? grey4 : secondary} inset width={1} insetType="middle" />
            ) : null}
          </View>
          <View style={styles.actionButtons}>
            <Button
              icon={
                <Icon
                  style={{ opacity: 0.8 }}
                  color={isOld ? grey3 : primary}
                  name="edit"
                  size={20}
                />
              }
              size="sm"
              type="clear"
              onPress={handleEditCalendarItem(index)}
            />
            <Button
              icon={
                <Icon
                  style={{ opacity: 0.8 }}
                  color={isOld ? grey3 : error}
                  name="delete"
                  size={20}
                />
              }
              loading={isDeletingIndex === index}
              size="sm"
              type="clear"
              loadingProps={{ size: "small", color: isOld ? grey3 : error, style: { height: 20 } }}
              onPress={handleDeleteClick(index, data.label)}
            />
          </View>
          <CalendarRecipeData
            isOld={isOld}
            recipeIds={data.recipeIds}
            onNavigateToRecipe={onNavigateToRecipe}
          />
        </View>
      ))}
    </View>
  );
}

interface CalendarRecipeDataProps {
  isOld: boolean;
  recipeIds: string[];
  onNavigateToRecipe: (recipe: Recipe) => void;
}

function CalendarRecipeData({ isOld, recipeIds, onNavigateToRecipe }: CalendarRecipeDataProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary, grey2, grey3 } = theme.colors;
  const recipes = useAppSelector((state) => selectRecipesByIds(state, recipeIds));

  return (
    <View style={styles.content}>
      {recipes.map((recipe) => (
        <TouchableOpacity
          key={recipe.id}
          style={styles.recipe}
          onPress={() => onNavigateToRecipe(recipe)}
        >
          {recipe.image === "" ? (
            <View>
              <Icon style={styles.noImage} name="photo" color={grey2} size={50} />
            </View>
          ) : (
            <Image
              style={{ ...styles.image, opacity: isOld ? 0.3 : 1 }}
              source={{ uri: recipe.image }}
              PlaceholderContent={
                <ActivityIndicator style={styles.activityIndicator} color={primary} />
              }
            />
          )}
          <Text style={{ flex: 1, color: isOld ? grey3 : undefined }} numberOfLines={2}>
            {recipe.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const MemoizedCalendarDayItem = React.memo(CalendarDayItem);

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      borderBottomWidth: 0.2,
    },
    content: {
      padding: 20,
      paddingTop: 0,
      rowGap: 5,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
    },
    dateText: {
      textTransform: "uppercase",
      fontWeight: "700",
      fontSize: 12,
      color: colors.grey3,
      paddingTop: 20,
      paddingLeft: 20,
    },
    noImage: {
      height: 80,
      width: 80,
      borderRadius: 20,
      backgroundColor: colors.disabled,
      justifyContent: "center",
    },
    image: {
      height: 80,
      width: 80,
      borderRadius: 20,
    },
    activityIndicator: {
      backgroundColor: colors.white,
      borderRadius: 20,
      height: "100%",
      width: "100%",
    },
    labelDivider: {
      paddingTop: 10,
    },
    label: {
      textTransform: "uppercase",
      fontWeight: "500",
      textAlign: "center",
      fontSize: 12,
      marginBottom: 3,
    },
    recipe: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 10,
    },
    actionButtons: {
      paddingTop: 5,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
    },
  });
