import React, { useState } from "react";
import ExamsNavbar from "./components/exams-navbar";
import { Switch } from "react-router-dom";
import HomePage from "./pages/home-page";
import { UserContext, SetUserContext, User } from "./auth";
import UserRoute from "./auth/UserRoute";

const App: React.FC<{}> = () => {
  const [user, setUser] = useState<User | undefined | false>(undefined);
  return (
    <UserContext.Provider value={user}>
      <SetUserContext.Provider value={setUser}>
        <div className="mobile-capable">
          <ExamsNavbar />
          <main className="main__container">
            <Switch>
              <UserRoute exact path="/" component={HomePage} />
            </Switch>
          </main>
        </div>
      </SetUserContext.Provider>
    </UserContext.Provider>
  );
};
export default App;
