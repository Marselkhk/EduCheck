"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, TrendingUp, Award, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface Grade {
    material_title: string;
    material_type: string;
    score: number;
    max_score: number;
    graded_at: string | null;
}

interface CourseGrades {
    student_id: number;
    course_title: string;
    course_code: string;
    group_name: string;
    teacher_name: string;
    status: string;
    total_score: number;
    max_possible: number;
    percentage: number;
    grades: Grade[];
}

export default function GradesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<CourseGrades[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:8000/students/my-grades", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setCourses(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    const statusInfo = (status: string) => {
        switch (status) {
            case "automatic":
                return { label: "Автомат", color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "admitted":
                return { label: "Допуск", color: "text-amber-700", bg: "bg-amber-50", icon: <AlertCircle className="w-4 h-4" /> };
            case "not_admitted":
                return { label: "Недопуск", color: "text-red-700", bg: "bg-red-50", icon: <XCircle className="w-4 h-4" /> };
            default:
                return { label: "Не выставлен", color: "text-gray-600", bg: "bg-gray-100", icon: null };
        }
    };

    const typeLabel = (type: string) => {
        switch (type) {
            case "lab": return "🧪 Лаба";
            case "hw": return "📝 ДЗ";
            case "test": return "✅ Тест";
            default: return type;
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    // Общий средний балл
    const totalPercentage = courses.length > 0
        ? Math.round(courses.reduce((sum, c) => sum + c.percentage, 0) / courses.length)
        : 0;

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push("/student")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Электронная зачётка</h1>
                    <p className="text-gray-600 mt-1">Все ваши оценки по дисциплинам</p>
                </div>

                {/* Общая статистика */}
                {courses.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Дисциплин</p>
                                <p className="text-4xl font-bold">{courses.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Средний балл</p>
                                <p className="text-4xl font-bold">{totalPercentage}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 mb-1">Всего оценок</p>
                                <p className="text-4xl font-bold">
                                    {courses.reduce((sum, c) => sum + c.grades.length, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {courses.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Пока пусто
                        </h3>
                        <p className="text-gray-600">
                            Присоединитесь к дисциплинам, чтобы увидеть оценки.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {courses.map((c) => {
                            const status = statusInfo(c.status);
                            const isExpanded = expanded === c.student_id;

                            return (
                                <div
                                    key={c.student_id}
                                    className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 overflow-hidden"
                                >
                                    {/* Шапка дисциплины */}
                                    <div
                                        onClick={() => setExpanded(isExpanded ? null : c.student_id)}
                                        className="p-6 cursor-pointer hover:bg-white/50 transition"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${status.bg} ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                    <span className="text-xs font-mono px-2 py-1 rounded bg-blue-50 text-blue-700">
                                                        {c.course_code}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">{c.course_title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {c.group_name} • {c.teacher_name}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-gray-900">
                                                    {c.percentage}%
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {c.total_score} / {c.max_possible}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Прогресс-бар */}
                                        <div className="mt-4 w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${c.percentage >= 80
                                                        ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                                        : c.percentage >= 50
                                                            ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                                            : "bg-gradient-to-r from-red-400 to-pink-500"
                                                    }`}
                                                style={{ width: `${Math.min(c.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Развёрнутый список */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                            {c.grades.length === 0 ? (
                                                <p className="text-center text-gray-500 py-4">
                                                    Оценок пока нет
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {c.grades.map((g, i) => {
                                                        const pct = Math.round((g.score / g.max_score) * 100);
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {typeLabel(g.material_type)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-900">
                                                                        {g.material_title}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                                        <div
                                                                            className={`h-full ${pct >= 80
                                                                                    ? "bg-emerald-500"
                                                                                    : pct >= 50
                                                                                        ? "bg-amber-500"
                                                                                        : "bg-red-500"
                                                                                }`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-gray-900 w-12 text-right">
                                                                        {g.score}/{g.max_score}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}