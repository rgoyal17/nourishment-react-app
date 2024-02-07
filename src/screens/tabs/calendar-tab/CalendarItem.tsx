import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Colors, Icon, Image, Text, useTheme } from "@rneui/themed";
import React from "react";
import { CalendarItemData } from "../../../redux/calendarSlice";
import { useAppSelector } from "../../../redux/hooks";
import { Recipe, selectRecipesByIds } from "../../../redux/recipesSlice";
import { TouchableOpacity } from "react-native-gesture-handler";

interface CalendarItemProps {
  data: CalendarItemData;
  onNavigateToRecipe: (recipe: Recipe) => void;
}

function CalendarItem({ data, onNavigateToRecipe }: CalendarItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const { label, recipeIds } = data;
  const recipes = useAppSelector((state) => selectRecipesByIds(state, recipeIds));

  return (
    <View style={styles.container}>
      {label != null ? <Text>{label}</Text> : null}
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

export const MemoizedCalendarItem = React.memo(CalendarItem);

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      rowGap: 10,
      padding: 20,
      borderBottomWidth: 1,
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
    recipe: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 10,
    },
  });
