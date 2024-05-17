import React from "react";
import { Button, CheckBox, Colors, Icon, useTheme } from "@rneui/themed";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Text, StyleSheet, View, ScrollView } from "react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";

interface SelectItemProps {
  title: string;
}

interface MultiSelectProps<T> {
  items: T[];
  searchInputLabel: string;
  selectedItems: T[];
  selectInputLabel: string;
  submitButtonLabel: string;
  onSelectItems: (items: T[]) => void;
}

export function MultiSelect<T extends SelectItemProps>({
  items,
  searchInputLabel,
  selectedItems,
  selectInputLabel,
  submitButtonLabel,
  onSelectItems,
}: MultiSelectProps<T>) {
  const { theme } = useTheme();
  const { grey3, error } = theme.colors;
  const styles = makeStyles(theme.colors);

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ["75%"], []);

  const [searchText, setSearchText] = React.useState("");
  const [stagedSelectedItems, setStagedSelectedItems] = React.useState<T[]>(selectedItems);

  const filteredItems = React.useMemo(
    () => items.filter((i) => i.title.toLowerCase().includes(searchText.toLowerCase())),
    [items, searchText],
  );

  const handleCheckChange = React.useCallback(
    (item: T) => () => {
      if (stagedSelectedItems.includes(item)) {
        setStagedSelectedItems(stagedSelectedItems.filter((i) => i !== item));
      } else {
        setStagedSelectedItems([...stagedSelectedItems, item]);
      }
    },
    [stagedSelectedItems],
  );

  const handleDone = React.useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onSelectItems(stagedSelectedItems);
  }, [onSelectItems, stagedSelectedItems]);

  const handleRemoveItem = React.useCallback(
    (item: T) => () => {
      const newItems = stagedSelectedItems.filter((i) => i !== item);
      setStagedSelectedItems(newItems);
      onSelectItems(newItems);
    },
    [onSelectItems, stagedSelectedItems],
  );

  return (
    <View style={styles.selector}>
      <ScrollView style={selectedItems.length > 0 ? styles.selectedItemsContainer : undefined}>
        {selectedItems.map((item, index) => (
          <View key={index} style={styles.selectedItem}>
            <Text style={{ flex: 1 }} numberOfLines={1}>
              {item.title}
            </Text>
            <Button
              buttonStyle={{ paddingRight: 0, marginRight: 0 }}
              icon={<Icon color={error} name="cross" size={20} type="entypo" />}
              size="sm"
              type="clear"
              onPress={handleRemoveItem(item)}
            />
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => bottomSheetRef.current?.present()}>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{selectInputLabel}</Text>
          <Icon color={grey3} name="caret-down" size={20} type="font-awesome" />
        </View>
      </TouchableOpacity>

      <BottomSheetModal
        enablePanDownToClose
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        onDismiss={() => setStagedSelectedItems(selectedItems)}
      >
        <View style={styles.bottomSheet}>
          <BottomSheetTextInput
            placeholder={searchInputLabel}
            style={styles.input}
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            returnKeyType="done"
          />
          <ScrollView contentContainerStyle={styles.itemsContainer}>
            {filteredItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.item} onPress={handleCheckChange(item)}>
                <CheckBox
                  containerStyle={styles.checkbox}
                  checked={stagedSelectedItems.includes(item)}
                />
                <Text style={{ flex: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button buttonStyle={styles.finalButton} title={submitButtonLabel} onPress={handleDone} />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    selector: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 10,
    },
    selectedItemsContainer: {
      marginBottom: 10,
      maxHeight: 110,
    },
    selectedItem: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      columnGap: 5,
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 4,
    },
    labelText: {
      opacity: 0.3,
    },
    bottomSheet: {
      flex: 1,
      padding: 10,
      paddingBottom: 20,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      height: 35,
      marginTop: 5,
    },
    itemsContainer: {
      flexGrow: 1,
      marginTop: 20,
      paddingBottom: 30,
      rowGap: 10,
    },
    checkbox: {
      padding: 0,
      margin: 0,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
    },
    finalButton: {
      borderRadius: 10,
      marginBottom: 10,
    },
  });
