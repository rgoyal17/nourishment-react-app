import { StackScreenProps } from "@react-navigation/stack";
import React, { useRef } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { RecipesTabStackParamList } from "./RecipesTab";
import { Colors, useTheme, Image, Button, Icon, BottomSheet, ListItem } from "@rneui/themed";
import NumericInput from "react-native-numeric-input";
import { IngredientsAndInstructions } from "./IngredientsAndInstructions";

type RecipeItemProps = StackScreenProps<RecipesTabStackParamList, "RecipeItem">;

export function RecipeItem({ navigation, route }: RecipeItemProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme.colors);
  const { recipe } = route.params;
  const [isBottomSheetVisible, setIsBottomSheetVisible] = React.useState(false);
  const [servings, setServings] = React.useState(
    recipe.servings !== "" ? Number(recipe.servings) : undefined,
  );

  const imageExists = React.useMemo(() => recipe.image !== "", [recipe.image]);

  const yOffset = useRef(new Animated.Value(0)).current;

  const backgroundColor = yOffset.interpolate({
    inputRange: [0, 400],
    outputRange: ["rgba(61, 172, 120, 0)", "rgba(61, 172, 120, 1)"],
    extrapolate: "clamp",
  });

  React.useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          color={theme.colors.white}
          buttonStyle={styles.headerButton}
          icon={<Icon name="chevron-left" color={theme.colors.primary} size={30} />}
          onPress={() => navigation.goBack()}
        />
      ),
      headerRight: () => (
        <Button
          color={theme.colors.white}
          buttonStyle={styles.headerButton}
          icon={<Icon name="more-horiz" color={theme.colors.primary} size={30} />}
          onPress={() => setIsBottomSheetVisible(true)}
        />
      ),
    });
  }, [navigation, styles.headerButton, theme.colors.primary, theme.colors.white]);

  React.useEffect(() => {
    if (imageExists) {
      navigation.setOptions({
        headerBackground: () => (
          <Animated.View style={{ backgroundColor, ...StyleSheet.absoluteFillObject }} />
        ),
        headerTransparent: imageExists,
      });
    }
  }, [backgroundColor, navigation, imageExists, theme.colors.primary]);

  return (
    <View style={styles.container}>
      <ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: yOffset } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {imageExists ? (
          <Image
            style={{ height: 400 }}
            source={{ uri: recipe.image }}
            PlaceholderContent={
              <ActivityIndicator style={styles.activityIndicator} color={theme.colors.primary} />
            }
          />
        ) : null}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.prepTime !== "" || recipe.cookTime !== "" ? (
            <View style={styles.time}>
              {recipe.prepTime != "" ? (
                <Text style={styles.timeText}>Prep time: {recipe.prepTime} mins</Text>
              ) : null}
              {recipe.cookTime !== "" ? (
                <Text style={styles.timeText}>Cook time: {recipe.cookTime} mins</Text>
              ) : null}
            </View>
          ) : null}
          {servings != null ? (
            <View style={styles.servings}>
              <Text style={styles.servingsText}>Servings: </Text>
              <NumericInput
                minValue={1}
                onChange={(serving) => setServings(serving)}
                rounded
                totalHeight={30}
                totalWidth={100}
                value={servings}
              />
            </View>
          ) : null}
          <IngredientsAndInstructions
            ingredients={recipe.ingredients}
            instructions={recipe.instructions}
          />
          {/* <Text>{SOME_TEXT}</Text> */}
        </View>
      </ScrollView>

      <BottomSheet
        isVisible={isBottomSheetVisible}
        onBackdropPress={() => setIsBottomSheetVisible(false)}
      >
        <ListItem>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="edit" />
            <ListItem.Title>Edit</ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem containerStyle={{ paddingBottom: 40 }}>
          <ListItem.Content style={styles.bottomSheetOption}>
            <Icon name="delete" />
            <ListItem.Title>Delete</ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheet>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    headerButton: {
      borderRadius: 30,
      padding: 0,
      paddingLeft: 0,
      paddingRight: 0,
      marginHorizontal: 10,
    },
    bottomSheetOption: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      columnGap: 10,
    },
    activityIndicator: {
      backgroundColor: colors.secondary,
      height: "100%",
      width: "100%",
    },
    content: {
      padding: 20,
      display: "flex",
      rowGap: 10,
    },
    title: {
      fontSize: 30,
      fontWeight: "500",
    },
    time: {
      display: "flex",
      flexDirection: "row",
      columnGap: 20,
    },
    timeText: {
      fontSize: 20,
      fontWeight: "400",
    },
    servings: {
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
    },
    servingsText: {
      fontSize: 15,
      fontWeight: "400",
    },
  });

const SOME_TEXT = `The standard Lorem Ipsum passage, used since the 1500s "Lorem ipsum
dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim
veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
ea commodo consequat. Duis aute irure dolor in reprehenderit in
voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
officia deserunt mollit anim id est laborum." Section 1.10.32 of "de
Finibus Bonorum et Malorum", written by Cicero in 45 BC "Sed ut
perspiciatis unde omnis iste natus error sit voluptatem accusantium
doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
inventore veritatis et quasi architecto beatae vitae dicta sunt
explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur
aut odit aut fugit, sed quia consequuntur magni dolores eos qui
ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui
dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed
quia non numquam eius modi tempora incidunt ut labore et dolore
magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
aliquid ex ea commodi consequatur? Quis autem vel eum iure
reprehenderit qui in ea voluptate velit esse quam nihil molestiae
consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla
pariatur?" 1914 translation by H. Rackham "But I must explain to you
how all this mistaken idea of denouncing pleasure and praising pain
was born and I will give you a complete account of the system, and
expound the actual teachings of the great explorer of the truth, the
master-builder of human happiness. No one rejects, dislikes, or
avoids pleasure itself, because it is pleasure, but because those
who do not know how to pursue pleasure rationally encounter
consequences that are extremely painful. Nor again is there anyone
who loves or pursues or desires to obtain pain of itself, because it
is pain, but because occasionally circumstances occur in which toil
and pain can procure him some great pleasure. To take a trivial
example, which of us ever undertakes laborious physical exercise,
except to obtain some advantage from it? But who has any right to
find fault with a man who chooses to enjoy a pleasure that has no
annoying consequences, or one who avoids a pain that produces no
resultant pleasure?" Section 1.10.33 of "de Finibus Bonorum et
Malorum", written by Cicero in 45 BC "At vero eos et accusamus et
iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum
deleniti atque corrupti quos dolores et quas molestias excepturi
sint occaecati cupiditate non provident, similique sunt in culpa qui
officia deserunt mollitia animi, id est laborum et dolorum fuga. Et
harum quidem rerum facilis est et expedita distinctio. Nam libero
tempore, cum soluta nobis est eligendi optio cumque nihil impedit
quo minus id quod maxime placeat facere possimus, omnis voluptas
assumenda est, omnis dolor repellendus. Temporibus autem quibusdam
et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et
voluptates repudiandae sint et molestiae non recusandae. Itaque
earum rerum hic tenetur a sapiente delectus, ut aut reiciendis
voluptatibus maiores alias consequatur aut perferendis doloribus
asperiores repellat." 1914 translation by H. Rackham "On the other
hand, we denounce with righteous indignation and dislike men who are
so beguiled and demoralized by the charms of pleasure of the moment,
so blinded by desire, that they cannot foresee the pain and trouble
that are bound to ensue; and equal blame belongs to those who fail
in their duty through weakness of will, which is the same as saying
through shrinking from toil and pain. These cases are perfectly
simple and easy to distinguish. In a free hour, when our power of
choice is untrammelled and when nothing prevents our being able to
do what we like best, every pleasure is to be welcomed and every
pain avoided. But in certain circumstances and owing to the claims
of duty or the obligations of business it will frequently occur that
pleasures have to be repudiated and annoyances accepted. The wise
man therefore always holds in these matters to this principle of
selection: he rejects pleasures to secure other greater pleasures,
or else he endures pains to avoid worse pains.`;
