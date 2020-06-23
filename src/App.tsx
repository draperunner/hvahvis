import React, { useState } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import 'firebase'
import 'firebase/firestore'

import { useAnonymousLogin, UserContext } from './auth'

import Home from './pages/Home'
import Game from './pages/Game'

import './App.css'

function App() {
    const user = useAnonymousLogin()
    const [name, setName] = useState<string>('')
    const [forceApp, setForceApp] = useState<boolean>(false)

    const setUserName = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!user) return

        user.updateProfile({
            displayName: name,
        }).then(() => {
            setForceApp(true)
        })
    }

    if (user && !user.displayName && !forceApp) {
        return (
            <div className="app">
                <h1>Hva kaller du deg?</h1>
                <form onSubmit={setUserName}>
                    <input
                        value={name}
                        onChange={(e) => setName(e.currentTarget.value)}
                    />
                    <button disabled={!name}>Bruk navn</button>
                </form>
            </div>
        )
    }

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
    )
}

export default App
