import { User, getAuth, onAuthStateChanged } from "firebase/auth";
import * as React from "react";

interface IAuthContext {
  user: User | undefined;
}

const AuthContext = React.createContext<IAuthContext>({ user: undefined });

export function AuthContextProvider({ children }: React.PropsWithChildren) {
  const auth = getAuth();
  const [user, setUser] = React.useState<User>();

  React.useEffect(() => {
    const unsubscribeFromAuthStateChanged = onAuthStateChanged(auth, (user) => {
      if (user != null) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        setUser(user);
      } else {
        // User is signed out
        setUser(undefined);
      }
    });

    return unsubscribeFromAuthStateChanged;
  }, [auth]);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return React.useContext(AuthContext);
}
