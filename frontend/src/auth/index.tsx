import { createContext, useContext } from "react";

export interface User {
  loggedin: boolean;
  username: string;
  userid: number;
  displayname: string;
  isAdmin: boolean;
  isCategoryAdmin: boolean;
  isExpert?: boolean;
}
export const notLoggedIn: User = {
  loggedin: false,
  isAdmin: false,
  isCategoryAdmin: false,
  userid: -1,
  username: "",
  displayname: "Not Authorized",
};
export const UserContext = createContext<User | undefined>(undefined);
export const useUser = () => useContext(UserContext);
export const SetUserContext = createContext<(user: User | undefined) => void>(
  () => {},
);
export const useSetUser = () => useContext(SetUserContext);
