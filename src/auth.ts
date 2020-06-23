import { createContext, useContext, useState, useEffect } from "react";
import firebase from "firebase/app";

import "firebase/analytics";
import "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDPW137C0olt0R-bkjZVrNQyTnmsDbZKH8",
    authDomain: "hva-hvis.firebaseapp.com",
    databaseURL: "https://hva-hvis.firebaseio.com",
    projectId: "hva-hvis",
    storageBucket: "hva-hvis.appspot.com",
    messagingSenderId: "954151168668",
    appId: "1:954151168668:web:018287c5810ade2c775b59"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export function useAnonymousLogin() {
  const [user, setUser] = useState<firebase.User | null>();

  useEffect(() => {
    return firebase.auth().onAuthStateChanged((newUser) => {
        setUser(newUser);

        if (!newUser) {
            firebase.auth().signInAnonymously().catch(console.error);
        }
    });
  }, []);

  return user
}

export const UserContext = createContext<firebase.User | null>(null);

export const useUser = () => useContext(UserContext);
