import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors, Divider, Icon, Image, Text, useTheme } from "@rneui/themed";
import React from "react";
import { CalendarItem } from "../../../redux/calendarSlice";
import { useAppSelector } from "../../../redux/hooks";
import { Recipe, selectRecipesByIds } from "../../../redux/recipesSlice";
import { TouchableOpacity } from "react-native-gesture-handler";

interface CalendarDayItemProps {
  calendarItem: CalendarItem;
  onNavigateToRecipe: (recipe: Recipe) => void;
}

function CalendarDayItem({ calendarItem, onNavigateToRecipe }: CalendarDayItemProps) {
  const { theme } = useTheme();
  const { secondary } = theme.colors;
  const styles = makeStyles(theme.colors);

  const { recipeData } = calendarItem;

  return (
    <View style={styles.container}>
      {recipeData.map((data, index) => (
        <View key={index}>
          <View style={index === 0 ? styles.labelDivider : undefined}>
            {data.label != null ? <Text style={styles.label}>{data.label}</Text> : null}
            {data.label != null || index !== 0 ? (
              <Divider color={secondary} inset width={1} insetType="middle" />
            ) : null}
          </View>
          <CalendarRecipeData recipeIds={data.recipeIds} onNavigateToRecipe={onNavigateToRecipe} />
        </View>
      ))}
    </View>
  );
}

interface CalendarRecipeDataProps {
  recipeIds: string[];
  onNavigateToRecipe: (recipe: Recipe) => void;
}

function CalendarRecipeData({ recipeIds, onNavigateToRecipe }: CalendarRecipeDataProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
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
              <Icon style={styles.noImage} name="photo" color={theme.colors.grey2} size={50} />
            </View>
          ) : (
            <Image
              style={styles.image}
              source={{ uri: recipe.image }}
              PlaceholderContent={
                <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
              }
            />
          )}
          <Text>{recipe.title}</Text>
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
      rowGap: 5,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
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
      rowGap: 2,
    },
    label: {
      color: colors.primary,
      textTransform: "uppercase",
      fontWeight: "500",
      textAlign: "center",
      fontSize: 12,
    },
    recipe: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 10,
    },
  });
