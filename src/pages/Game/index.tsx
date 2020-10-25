import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'

import firebase from 'firebase/app'
import 'firebase/firestore'

import { useUser } from '../../auth'

const NUM_QUESTIONS_PER_PLAYER = 1

interface Player {
    name: string
    uid: string
}

interface Question {
    id: string
    question: string
    answer: string
    author: Player
    answerAuthor?: Player
    questionAuthor?: Player
}

interface Game {
    status: 'STARTED' | 'OVER'
    host: Player
    participants: Player[]
    questions: Question[]
    scrambledQuestions: Question[] | null
}

function pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

/**
 * Shuffles an array and ensures no items end up on their original position
 */
function shuffle<T>(arr: T[]): T[] {
    if (arr.length <= 1) {
        return arr
    }
    return arr.reduce((items, item) => {
        const available = arr.filter((q) => q !== item && !items.includes(q))
        return [...items, pickRandom(available)]
    }, [] as T[])
}

function scramble(qs: Question[]): Question[] {
    const questions = shuffle(qs)
    const answers = shuffle(questions)

    return qs.map((q, i) => ({
        ...q,
        question: questions[i].question,
        questionAuthor: questions[i].author,
        answer: answers[i].answer,
        answerAuthor: answers[i].author,
    }))
}

export default function Game() {
    const user = useUser()
    const { id } = useParams<{ id: string }>()

    const [game, setGame] = useState<Game | undefined>()
    const [loading, setLoading] = useState<boolean>(true)

    const [questions, setQuestions] = useState<Question[]>([])

    const [question, setQuestion] = useState<string>('Hva ville du gjort hvis ')
    const [answer, setAnswer] = useState<string>('')

    const questionInputRef = useRef<HTMLInputElement>(null)

    const isHost = game && user && game?.host?.uid === user?.uid

    useEffect(() => {
        if (!id || !user) return

        return firebase
            .firestore()
            .collection('games')
            .doc(id)
            .onSnapshot((doc) => {
                setLoading(false)
                if (!doc.exists) {
                    return
                }
                const gameData = doc.data() as Game

                if (!gameData) {
                    return
                }

                setGame(gameData)
            })
    }, [id, user])

    useEffect(() => {
        if (!game || !user) return

        setQuestions(
            game.questions.filter(({ author }) => author.uid === user.uid),
        )
    }, [id, user, game])

    useEffect(() => {
        if (!id || !user || !game) return

        if (!isHost && !game.participants.some(({ uid }) => uid === user.uid)) {
            firebase
                .firestore()
                .collection('games')
                .doc(id)
                .update({
                    participants: firebase.firestore.FieldValue.arrayUnion({
                        name: user.displayName,
                        uid: user.uid,
                    }),
                })
        }
    }, [game, id, isHost, user])

    const addQuestion = (e: any) => {
        e.preventDefault()
        if (!user || !game) return

        const player = {
            uid: user.uid,
            name: user.displayName || '',
        }

        const q: Question = {
            id: `${user.uid}-${questions.length}`,
            question,
            answer,
            author: player,
        }

        setQuestions((prev) => [...prev, q])
        setQuestion('Hva ville du gjort hvis ')
        setAnswer('')

        if (questionInputRef.current) {
            questionInputRef.current.focus()
        }

        firebase
            .firestore()
            .collection('games')
            .doc(id)
            .update({
                questions: firebase.firestore.FieldValue.arrayUnion(q),
            })
    }

    const setGameDone = () => {
        if (!game) return
        const scrambledQuestions = scramble(game.questions)

        return firebase.firestore().collection('games').doc(id).update({
            status: 'OVER',
            scrambledQuestions,
        })
    }

    const newGame = () => {
        if (!game) return
        return firebase
            .firestore()
            .collection('games')
            .doc(id)
            .set({
                ...game,
                questions: [],
                status: 'STARTED',
                scrambledQuestions: null,
            })
    }

    if (loading) {
        return null
    }

    if (!game) {
        return (
            <div>
                <h1>Fant ikke spillet!</h1>
                <p>Brukte du feil pin?</p>
                <div>
                    <Link to="/">Gå til framsida.</Link>
                </div>
            </div>
        )
    }

    if (game?.status === 'OVER') {
        return (
            <div>
                <h1>Vi går gjennom svarene!</h1>

                {(game?.scrambledQuestions || []).map((q, index) => (
                    <div key={q.id}>
                        <b>{`Spørsmål ${index + 1}`}</b>
                        <p>{q.question}</p>
                        <p>{q.answer}</p>
                    </div>
                ))}

                {isHost ? (
                    <button onClick={newGame}>Start ny runde</button>
                ) : null}
            </div>
        )
    }

    return (
        <div>
            <h1>Hva ville du gjort hvis ...</h1>
            <h2>Pin: {id}</h2>

            <p>Skriv spørsmål med tilhørende svar.</p>
            {user ? <p>{`Ditt navn er ${user.displayName}.`}</p> : null}

            {questions.map((q, index) => (
                <div key={q.id}>
                    <b>{`Spørsmål ${index + 1}`}</b>
                    <p>{q.question}</p>
                    <p>{q.answer}</p>
                </div>
            ))}

            {questions.length < NUM_QUESTIONS_PER_PLAYER ? (
                <form onSubmit={addQuestion}>
                    <label>
                        Spørsmål
                        <input
                            placeholder="Hva ville du gjort hvis ..."
                            value={question}
                            ref={questionInputRef}
                            onChange={(e) => setQuestion(e.currentTarget.value)}
                            autoFocus
                        />
                    </label>
                    <label>
                        Svar
                        <input
                            placeholder="Jeg ville ha ..."
                            value={answer}
                            onChange={(e) => setAnswer(e.currentTarget.value)}
                        />
                    </label>
                    <button
                        disabled={!user || !question.length || !answer.length}
                    >
                        Legg til spørsmål
                    </button>
                </form>
            ) : (
                <h2>Du er ferdig. Bra! Venter på resten ...</h2>
            )}

            {game ? (
                <p>{`${Math.floor(
                    game.questions.length / NUM_QUESTIONS_PER_PLAYER,
                )}/${game.participants.length} deltagere er ferdige`}</p>
            ) : null}

            {isHost ? (
                <button onClick={setGameDone}>Vis svarene!</button>
            ) : null}
        </div>
    )
}
