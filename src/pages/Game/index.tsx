import React, { useState, useEffect, useRef } from 'react'

import firebase from 'firebase/app'
import 'firebase/firestore'
import { useParams } from 'react-router-dom'

import { useUser } from '../../auth'

const NUM_QUESTIONS_PER_PLAYER = 5

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
    scrambledQuestions?: Question[]
}

function shuffle<T>(a: T[]): T[] {
    const b = [...a]
    for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[b[i], b[j]] = [b[j], b[i]]
    }
    return b
}

function scramble(qs: Question[]): Question[] {
    const questions = shuffle(qs)
    const answers = shuffle(qs)

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
    const { id } = useParams()

    const [game, setGame] = useState<Game>()

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
                const gameData = doc.data() as Game

                if (!gameData) {
                    return
                }

                setGame(gameData)
            })
    }, [id, user])

    useEffect(() => {
        if (!game || !user || questions.length > 0) return

        setQuestions(
            game.questions.filter(({ author }) => author.uid === user.uid),
        )
    }, [id, user, questions, game])

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

    if (game?.status === 'OVER') {
        return (
            <div>
                <h1>Vi går gjennom svarene!</h1>

                {(game?.scrambledQuestions || []).map((q, index) => (
                    <div key={q.id}>
                        <b>{`Spørsmål ${index + 1}`}</b>
                        <p>
                            {q.questionAuthor?.name}: {q.question}
                        </p>
                        <p>
                            {q.answerAuthor?.name}: {q.answer}
                        </p>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div>
            <h1>Hva ville du gjort hvis ...</h1>
            <h2>Pin: {id}</h2>

            <p>Skriv fem spørsmål og svar.</p>
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
                        disabled={
                            !user ||
                            questions.length >= NUM_QUESTIONS_PER_PLAYER
                        }
                    >
                        Legg til spørsmål
                    </button>
                </form>
            ) : (
                <h2>Du er ferdig med dine spørsmål. Bra!</h2>
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
