import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { GroceriesTabStackParamList } from "./GroceriesTab";
import { View, StyleSheet } from "react-native";
import { Colors, Icon, ListItem, useTheme } from "@rneui/themed";
import { useAuthentication } from "../../../hooks/useAuthentication";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchGroceries, selectGroceriesState } from "../../../redux/groceriesSlice";
import { ZeroState } from "../../../common/ZeroState";
import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";

type GroceriesProps = StackScreenProps<GroceriesTabStackParamList, "GroceriesPage">;

export function GroceriesPage({ navigation }: GroceriesProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { user } = useAuthentication();
  const dispatch = useAppDispatch();

  const addBottomSheetRef = React.useRef<BottomSheetModal>(null);
  const addSnapPoints = React.useMemo(() => ["25%"], []);

  const groceriesState = useAppSelector(selectGroceriesState);

  React.useEffect(() => {
    if (user != null) {
      dispatch(fetchGroceries(user.uid));
    }
  }, [dispatch, user]);

  const handleImportFromCalendar = React.useCallback(() => {
    addBottomSheetRef.current?.dismiss();
    navigation.navigate("CalendarGroceries");
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ZeroState
        imgSrc={require("../../../../assets/groceries.png")}
        imgStyle={styles.zeroStateImg}
        title="No Groceries Found"
        subtitle="Add some grocery items to view them here"
        actionButtonProps={{
          title: "Add Grocery Items",
          onPress: () => addBottomSheetRef.current?.present(),
        }}
      />

      <BottomSheetModal
        enablePanDownToClose
        ref={addBottomSheetRef}
        snapPoints={addSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <ListItem>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="add" type="ionicon" />
            <ListItem.Title>Add new item</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="menu-book" />
            <ListItem.Title>Ingredients of recipes</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={handleImportFromCalendar}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="calendar" type="font-awesome" />
            <ListItem.Title>Meal prep calendar</ListItem.Title>
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
    },
    zeroStateImg: {
      marginTop: -40,
      opacity: 0.6,
      height: 170,
      width: 170,
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
    },
  });
