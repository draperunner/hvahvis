import React from 'react'

import firebase from 'firebase/app'
import 'firebase/firestore'
import { useHistory } from 'react-router-dom'

import { useUser } from '../../auth'

export default function Home() {
    const user = useUser()
    const history = useHistory()

    const createGame = () => {
        if (!user) return

        const id = `${Math.floor(Math.random() * 10000)}`.padStart(4, '0')

        firebase
            .firestore()
            .collection('games')
            .doc(id)
            .set({
                host: {
                    name: user.displayName,
                    uid: user.uid,
                },
                participants: [
                    {
                        name: user.displayName,
                        uid: user.uid,
                    },
                ],
                questions: [],
            })
            .then(() => {
                history.push(`/g/${id}`)
            })
    }

    return (
        <div>
            <h1>Hva ville du gjort hvis ...</h1>
            <p>
                Still et spørsmål. Svar på det. Bland svar og spørsmål med
                vennene dine. Le.
            </p>
            <button onClick={createGame}>Nytt spill</button>
        </div>
    )
}
