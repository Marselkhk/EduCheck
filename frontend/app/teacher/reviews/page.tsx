"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import Logo from "@/components/Logo";

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    course_title: string;
    created_at: string;
}

export default function TeacherReviewsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState<number | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:8000/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setMyId(data.id);
                return fetch(`http://localhost:8000/reviews/teacher/${data.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            })
            .then((res) => res.json())
            .then((data) => {
                setReviews(data.reviews || []);
                setAverage(data.average || 0);
                setCount(data.count || 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push("/teacher")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Мои отзывы</h1>
                    <p className="text-gray-600 mt-1">Анонимные отзывы студентов</p>
                </div>

                {/* Средний балл */}
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl p-8 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-100 mb-1">Средний балл</p>
                            <p className="text-5xl font-bold">{average.toFixed(1)}</p>
                            <p className="text-sm text-amber-100 mt-2">
                                На основе {count} {count === 1 ? "отзыва" : count < 5 ? "отзывов" : "отзывов"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="flex gap-1 justify-end mb-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star
                                        key={i}
                                        className={`w-8 h-8 ${i <= Math.round(average)
                                                ? "fill-white text-white"
                                                : "text-amber-300"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Список отзывов */}
                {reviews.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                            <Star className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Отзывов пока нет
                        </h3>
                        <p className="text-gray-600">
                            Студенты смогут оставить отзыв после прохождения курса.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((r) => (
                            <div
                                key={r.id}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        ?
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-gray-900">Анонимный студент</p>
                                                <p className="text-xs text-gray-500">{r.course_title}</p>
                                            </div>
                                            {renderStars(r.rating)}
                                        </div>
                                        {r.comment && (
                                            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                                                {r.comment}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(r.created_at).toLocaleDateString("ru")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}