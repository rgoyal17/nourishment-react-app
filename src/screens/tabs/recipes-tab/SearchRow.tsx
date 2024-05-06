import { Button, Colors, Icon, SearchBar, Tooltip, useTheme } from "@rneui/themed";
import React from "react";
import { View, StyleSheet } from "react-native";
import { SortOption } from "../../../redux/recipeSortSlice";

interface SearchRowProps {
  searchText: string;
  sortOption: SortOption;
  onChangeSearchText: (searchText: string) => void;
  onSelectSortOption: (sortOption: SortOption) => void;
}

export function SearchRow({
  sortOption,
  searchText,
  onChangeSearchText,
  onSelectSortOption,
}: SearchRowProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { primary, secondary } = theme.colors;
  const [isSortTooltipOpen, setIsSortTooltipOpen] = React.useState(false);

  const handleSelectSortOption = (option: SortOption) => () => {
    onSelectSortOption(option);
    setIsSortTooltipOpen(false);
  };

  return (
    <View style={styles.searchRow}>
      <SearchBar
        lightTheme={true}
        round={true}
        placeholder="Search recipes..."
        onChangeText={(text) => onChangeSearchText(text)}
        value={searchText}
        returnKeyType="search"
        searchIcon={<Icon name="search" color={primary} size={20} />}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInput}
        leftIconContainerStyle={{ paddingRight: 0 }}
      />
      <Tooltip
        visible={isSortTooltipOpen}
        onOpen={() => setIsSortTooltipOpen(true)}
        onClose={() => setIsSortTooltipOpen(false)}
        popover={
          <View>
            <Button
              buttonStyle={{ ...styles.sortOption, ...styles.firstSortOption }}
              title="Name"
              onPress={handleSelectSortOption(SortOption.Name)}
              type={sortOption === SortOption.Name ? "solid" : "clear"}
              titleStyle={{ color: sortOption === SortOption.Name ? secondary : primary }}
            />
            <Button
              buttonStyle={styles.sortOption}
              title="Newest"
              onPress={handleSelectSortOption(SortOption.Newest)}
              type={sortOption === SortOption.Newest ? "solid" : "clear"}
              titleStyle={{ color: sortOption === SortOption.Newest ? secondary : primary }}
            />
            <Button
              buttonStyle={{ ...styles.sortOption, ...styles.lastSortOption }}
              title="Oldest"
              onPress={handleSelectSortOption(SortOption.Oldest)}
              type={sortOption === SortOption.Oldest ? "solid" : "clear"}
              titleStyle={{ color: sortOption === SortOption.Oldest ? secondary : primary }}
            />
          </View>
        }
        withPointer={false}
        containerStyle={styles.sortPopover}
      >
        <Button
          icon={<Icon name="sort" color={primary} />}
          buttonStyle={styles.sortButton}
          onPress={() =>
            isSortTooltipOpen ? setIsSortTooltipOpen(false) : setIsSortTooltipOpen(true)
          }
        />
      </Tooltip>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    searchRow: {
      flexDirection: "row",
      marginTop: 5,
      alignItems: "center",
    },
    searchContainer: {
      backgroundColor: colors.secondary,
      borderBottomWidth: 0,
      borderTopWidth: 0,
      flex: 1,
    },
    searchInput: {
      backgroundColor: colors.white,
      height: 40,
    },
    sortPopover: {
      marginLeft: 70,
      height: 120,
      width: 100,
      borderRadius: 10,
      backgroundColor: colors.secondary,
    },
    sortButton: {
      width: 40,
      height: 40,
      marginRight: 7,
      borderRadius: 10,
      backgroundColor: colors.white,
    },
    sortOption: {
      height: 40,
      width: 100,
    },
    firstSortOption: {
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    lastSortOption: {
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
  });
