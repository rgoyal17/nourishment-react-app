import { User, getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import * as React from "react";
import { uploadImageToFirebase } from "../common/uploadImageToFirebase";
import { SortOption } from "../redux/recipeSortSlice";
import { UserProfile } from "../redux/userProfileSlice";
import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";

interface IAuthContext {
  user: User | undefined;
  isSettingUpUser: boolean;
}

const AuthContext = React.createContext<IAuthContext>({ user: undefined, isSettingUpUser: true });

export function AuthContextProvider({ children }: React.PropsWithChildren) {
  const auth = getAuth();
  const [user, setUser] = React.useState<User>();
  const [isSettingUpUser, setIsSettingUpUser] = React.useState(false);

  React.useEffect(() => {
    const setupDatabaseAndUser = async (user: User) => {
      setIsSettingUpUser(true);
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, `users/${user.uid}`));
        if (!userDoc.exists()) {
          // store photo in firebase and use that link
          let profile: UserProfile = { uid: user.uid, email: user.email, name: user.displayName };
          if (user.photoURL != null) {
            const photo = await uploadImageToFirebase(user.photoURL, `${user.uid}/image.jpg`);
            profile = { ...profile, photo };
          }

          await setDoc(doc(db, `users/${user.uid}`), {
            recipeSortOption: SortOption.Name,
            groceries: [],
            profile,
          });
        }
      } catch (e) {
        Alert.alert("Failed to sign in");
        Sentry.captureException(e);
      }
      setIsSettingUpUser(false);
      setUser(user);
    };

    const unsubscribeFromAuthStateChanged = onAuthStateChanged(auth, (user) => {
      if (user != null) {
        setupDatabaseAndUser(user);
      } else {
        // User is signed out
        setUser(undefined);
      }
    });

    return unsubscribeFromAuthStateChanged;
  }, [auth]);

  return <AuthContext.Provider value={{ user, isSettingUpUser }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return React.useContext(AuthContext);
}
