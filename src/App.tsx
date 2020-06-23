import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import "firebase";
import "firebase/firestore";

import { useAnonymousLogin, UserContext } from "./auth";

import Home from "./pages/Home";
import Game from "./pages/Game";

import "./App.css"

function App() {
  const { user } = useAnonymousLogin();
  return (
    <UserContext.Provider value={user || null}>
      <Router>
        <div className="app">
          <Switch>
            <Route path="/g/:id">
                <Game />
            </Route>
            <Route path="/">
                <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
