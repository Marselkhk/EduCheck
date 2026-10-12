"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Question {
    id: number;
    question_text: string;
    question_type: string;
    options: string[];
    time_limit: number;
    points: number;
}

export default function TestPage() {
    const params = useParams();
    const router = useRouter();
    const materialId = params.id as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string[]>>({});
    const [textInput, setTextInput] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`http://localhost:8000/tests/${materialId}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (!Array.isArray(data) || data.length === 0) {
                    setError("В тесте нет вопросов");
                    setLoading(false);
                    return;
                }
                setQuestions(data);
                setTimeLeft(data[0].time_limit || 60);
                setLoading(false);
            })
            .catch(() => {
                setError("Ошибка загрузки");
                setLoading(false);
            });
    }, [materialId, router, token]);

    // Таймер
    useEffect(() => {
        if (loading || result || questions.length === 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Время вышло — переходим к следующему
                    handleNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentIndex, loading, result, questions]);

    // Защита от копирования
    useEffect(() => {
        const disableCopy = (e: Event) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener("copy", disableCopy);
        document.addEventListener("cut", disableCopy);
        document.addEventListener("contextmenu", disableCopy);

        return () => {
            document.removeEventListener("copy", disableCopy);
            document.removeEventListener("cut", disableCopy);
            document.removeEventListener("contextmenu", disableCopy);
        };
    }, []);

    const currentQuestion = questions[currentIndex];

    const handleSelectAnswer = (option: string) => {
        if (!currentQuestion) return;

        const current = answers[currentQuestion.id] || [];

        if (currentQuestion.question_type === "single") {
            setAnswers({ ...answers, [currentQuestion.id]: [option] });
        } else if (currentQuestion.question_type === "multiple") {
            if (current.includes(option)) {
                setAnswers({
                    ...answers,
                    [currentQuestion.id]: current.filter((a) => a !== option),
                });
            } else {
                setAnswers({
                    ...answers,
                    [currentQuestion.id]: [...current, option],
                });
            }
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setTimeLeft(questions[currentIndex + 1].time_limit || 60);
        } else {
            submitTest();
        }
    };

    const submitTest = async () => {
        if (submitting) return;
        setSubmitting(true);

        // Для текстового вопроса сохраняем ввод
        const finalAnswers = { ...answers };
        if (currentQuestion?.question_type === "text" && textInput.trim()) {
            finalAnswers[currentQuestion.id] = [textInput];
        }

        const res = await fetch("http://localhost:8000/tests/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                material_id: Number(materialId),
                answers: finalAnswers,
            }),
        });

        if (res.ok) {
            const data = await res.json();
            setResult(data);
        } else {
            const data = await res.json();
            setError(data.detail || "Ошибка отправки");
        }
        setSubmitting(false);
    };

    // Результат
    if (result) {
        const percentage = Math.round((result.auto_score / result.max_score) * 100);
        return (
            <main className="min-h-screen p-6 lg:p-8 flex items-center justify-center">
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/80 p-12 max-w-2xl w-full text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Тест завершён!</h1>
                    <p className="text-gray-600 mb-8">Ваши ответы отправлены преподавателю</p>

                    <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                        {result.auto_score} / {result.max_score}
                    </div>
                    <p className="text-gray-500 mb-8">{percentage}% правильных ответов</p>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 mb-8">
                        ⏳ Преподаватель проверит и подтвердит результат
                    </div>

                    <button
                        onClick={() => router.push("/student")}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-500/30"
                    >
                        Вернуться к дисциплинам
                    </button>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка теста...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-900 font-bold mb-4">{error}</p>
                    <button
                        onClick={() => router.push(`/student/discipline/14`)}
                        className="text-blue-600 hover:underline"
                    >
                        ← Назад к дисциплине
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft <= 10 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        }`}>
                        <Clock className="w-5 h-5" />
                        {timeLeft} сек
                    </div>
                </header>

                {/* Прогресс */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Вопрос {currentIndex + 1} из {questions.length}</span>
                        <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Вопрос */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/80 p-8 select-none">
                    <div className="mb-6">
                        <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                            {currentQuestion.question_type === "single" && "Один ответ"}
                            {currentQuestion.question_type === "multiple" && "Несколько ответов"}
                            {currentQuestion.question_type === "text" && "Текстовый ответ"}
                            {" • "}{currentQuestion.points} балл
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                        {currentQuestion.question_text}
                    </h2>

                    {/* Варианты */}
                    {currentQuestion.question_type !== "text" && (
                        <div className="space-y-3">
                            {currentQuestion.options.map((opt, i) => {
                                const selected = (answers[currentQuestion.id] || []).includes(opt);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectAnswer(opt)}
                                        className={`w-full text-left px-5 py-4 rounded-xl border-2 transition font-medium ${selected
                                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                                : "border-gray-200 bg-white hover:border-blue-300"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                                }`}>
                                                {selected && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            {opt}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {currentQuestion.question_type === "text" && (
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={5}
                            placeholder="Введите ответ..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {/* Кнопка Далее */}
                    <button
                        onClick={handleNext}
                        disabled={submitting}
                        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-semibold shadow-lg shadow-blue-500/30"
                    >
                        {submitting ? "Отправка..." : currentIndex < questions.length - 1 ? "Следующий вопрос →" : "Завершить тест"}
                    </button>
                </div>
            </div>
        </main>
    );
}