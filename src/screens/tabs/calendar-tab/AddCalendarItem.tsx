import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, Colors, useTheme } from "@rneui/themed";
import DatePicker from "react-native-date-picker";

export function AddCalendarItem() {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);

  const [date, setDate] = React.useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const handleConfirmDate = React.useCallback((newDate: Date) => {
    setDate(newDate);
    setIsDatePickerOpen(false);
  }, []);

  return (
    <KeyboardAwareScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
      style={{ backgroundColor: theme.colors.secondary }}
    >
      <Button title="Open" onPress={() => setIsDatePickerOpen(true)} />
      <DatePicker
        modal={true}
        open={isDatePickerOpen}
        date={date}
        onConfirm={handleConfirmDate}
        onCancel={() => setIsDatePickerOpen(false)}
      />
    </KeyboardAwareScrollView>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },

    error: {
      marginTop: 5,
      color: colors.error,
    },

    input: {
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 10,
      height: 35,
      marginTop: 10,
    },
  });
