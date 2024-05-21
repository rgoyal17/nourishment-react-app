import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetProps,
  TouchableOpacity,
} from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Icon } from "@rneui/themed";
import { IconProps } from "@rneui/themed/dist/Icon";
import React, { ForwardedRef } from "react";
import { StyleSheet, Text, View } from "react-native";

interface BottomSheetModelProps extends Omit<BottomSheetProps, "children"> {
  modalItems: { iconProps?: IconProps; title: string; onPress: () => void }[];
}

export const BottomSheetList = React.forwardRef(
  (
    { modalItems, snapPoints }: BottomSheetModelProps,
    ref: ForwardedRef<BottomSheetModalMethods>,
  ) => {
    const styles = makeStyles();

    return (
      <BottomSheetModal
        enablePanDownToClose
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <View style={{ rowGap: 10 }}>
          {modalItems.map(({ iconProps, title, onPress }, index) => (
            <TouchableOpacity style={styles.bottomSheetOption} key={index} onPress={onPress}>
              {iconProps == null ? null : <Icon {...iconProps} />}
              <Text style={{ fontSize: 17 }}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetModal>
    );
  },
);
BottomSheetList.displayName = "BottomSheet";

const makeStyles = () =>
  StyleSheet.create({
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      columnGap: 10,
      padding: 10,
    },
  });
