import React, { useState } from 'react'

import firebase from 'firebase/app'
import 'firebase/firestore'
import { useHistory } from 'react-router-dom'

import { useUser } from '../../auth'

export default function Home() {
    const user = useUser()
    const history = useHistory()

    const [pin, setPin] = useState<string>('')

    const goToGame = (pin: string) => {
        history.push(`/${pin}`)
    }

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
                scrambledQuestions: null,
            })
            .then(() => goToGame(id))
    }

    return (
        <div>
            <h1>Hva ville du gjort hvis ...</h1>
            <p>
                Still et spørsmål. Svar på det. Bland svar og spørsmål med
                vennene dine. Le.
            </p>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    goToGame(pin)
                }}
            >
                <label>
                    Pin:
                    <input
                        autoFocus
                        value={pin}
                        onChange={(e) => setPin(e.currentTarget.value)}
                    />
                </label>
                <button disabled={pin.length < 4}>Bli med i spillet</button>
            </form>

            <button
                type="button"
                onClick={createGame}
                style={{ marginTop: 20 }}
            >
                Nytt spill
            </button>
        </div>
    )
}
