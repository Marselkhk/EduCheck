"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import Logo from "@/components/Logo";

export default function ReviewPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [courseId, setCourseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        // Получаем инфу о группе → course_id
        fetch("http://localhost:8000/students/my-disciplines", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then(async (disciplines) => {
                const disc = disciplines.find((d: any) => d.group_id === Number(groupId));
                if (!disc) {
                    setLoading(false);
                    return;
                }
                setCourseId(disc.course_id);

                // Проверяем, есть ли мой отзыв
                const reviewRes = await fetch(`http://localhost:8000/reviews/my/${disc.course_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (reviewRes.ok) {
                    const data = await reviewRes.json();
                    if (data) {
                        setRating(data.rating);
                        setComment(data.comment || "");
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [groupId, router, token]);

    const submitReview = async () => {
        if (!courseId || rating === 0) {
            alert("Поставьте оценку");
            return;
        }

        setSaving(true);
        const res = await fetch("http://localhost:8000/reviews/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                course_id: courseId,
                rating,
                comment,
            }),
        });

        setSaving(false);

        if (res.ok) {
            setSaved(true);
            setTimeout(() => router.push(`/student/discipline/${groupId}`), 1500);
        } else {
            alert("Ошибка сохранения");
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    if (saved) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">✓ Спасибо за отзыв!</p>
                    <p className="text-gray-600 mt-2">Перенаправление...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push(`/student/discipline/${groupId}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/80 p-8 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Оцените преподавателя
                            </h1>
                            <p className="text-gray-600">
                                Отзыв анонимный. Преподаватель не узнает, кто его оставил.
                            </p>
                        </div>

                        {/* Звёзды */}
                        <div className="flex justify-center gap-3 mb-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setRating(i)}
                                    onMouseEnter={() => setHoverRating(i)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-12 h-12 transition-colors ${i <= (hoverRating || rating)
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        {rating > 0 && (
                            <p className="text-center text-lg font-medium text-gray-900 mb-6">
                                {rating === 1 && "😞 Очень плохо"}
                                {rating === 2 && "😐 Плохо"}
                                {rating === 3 && "🙂 Нормально"}
                                {rating === 4 && "😊 Хорошо"}
                                {rating === 5 && "🤩 Отлично"}
                            </p>
                        )}

                        {/* Комментарий */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                                Комментарий (необязательно)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={5}
                                placeholder="Что понравилось? Что можно улучшить?"
                                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        <button
                            onClick={submitReview}
                            disabled={saving || rating === 0}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-2xl hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 transition-all font-semibold shadow-lg shadow-amber-500/30"
                        >
                            {saving ? "Отправка..." : "Отправить отзыв"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}