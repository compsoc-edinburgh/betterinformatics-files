import { createContext, useContext } from "react";

export interface User {
  loggedin: boolean;
  username: string;
  displayname: string;
  isAdmin: boolean;
  isCategoryAdmin: boolean;
  isExpert?: boolean;
}
export const notLoggedIn: User = {
  loggedin: false,
  isAdmin: false,
  isCategoryAdmin: false,
  username: "",
  displayname: "Not Authorized",
};
export const UserContext = createContext<User | undefined>(undefined);
export const useUser = () => useContext(UserContext);
export const SetUserContext = createContext<(user: User | undefined) => void>(
  () => {},
);
export const useSetUser = () => useContext(SetUserContext);
