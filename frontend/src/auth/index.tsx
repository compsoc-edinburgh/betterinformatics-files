import { createContext, useContext } from "react";

export interface User {
  loggedin: boolean;
  username: string;
  displayname: string;
  isAdmin: boolean;
  isCategoryAdmin: boolean;
}

export const UserContext = createContext<User | undefined | false>(undefined);
export const useUser = () => useContext(UserContext);
export const SetUserContext = createContext<(user: User | false) => void>(
  () => {},
);
export const useSetUser = () => useContext(SetUserContext);
