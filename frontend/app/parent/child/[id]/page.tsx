"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Award, BookOpen, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface CourseData {
    course_title: string;
    group_name: string;
    total_score: number;
    max_possible: number;
    percentage: number;
    status: string;
    auto_threshold: number;
    admission_threshold: number;
    labs_done: number;
    labs_total: number;
    hw_done: number;
    hw_total: number;
    tests_done: number;
    tests_total: number;
    attendance_percentage: number;
    attendance_total: number;
    exam_date: string | null;
    exam_room: string | null;
    exam_format: string | null;
}

interface ChildData {
    student_id: number;
    student_name: string;
    student_email: string;
    courses: CourseData[];
}

export default function ChildPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.id as string;

    const [data, setData] = useState<ChildData | null>(null);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`http://localhost:8000/parents/child/${studentId}/overview`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [studentId, router, token]);

    const statusInfo = (status: string) => {
        switch (status) {
            case "automatic":
                return { label: "АВТОМАТ", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", icon: <CheckCircle2 className="w-5 h-5" /> };
            case "admitted":
                return { label: "ДОПУСК", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", icon: <AlertCircle className="w-5 h-5" /> };
            case "not_admitted":
                return { label: "НЕДОПУСК", color: "text-red-700", bg: "bg-red-50", border: "border-red-300", icon: <XCircle className="w-5 h-5" /> };
            default:
                return { label: "—", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-300", icon: null };
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Нет данных</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push("/parent")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
                            {data.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{data.student_name}</h1>
                            <p className="text-indigo-100">{data.student_email}</p>
                        </div>
                    </div>
                </div>

                {data.courses.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <p className="text-gray-500">Ребёнок ещё не присоединился к дисциплинам</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {data.courses.map((course, i) => {
                            const status = statusInfo(course.status);
                            return (
                                <div
                                    key={i}
                                    className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6"
                                >
                                    <div className="flex justify-between items-start gap-4 mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">{course.course_title}</h2>
                                            <p className="text-sm text-gray-500">{course.group_name}</p>
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${status.bg} ${status.border} border-2 ${status.color} font-bold`}>
                                            {status.icon}
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">
                                                Набрано: <strong>{course.total_score}</strong> из {course.max_possible}
                                            </span>
                                            <span className="text-3xl font-bold text-gray-900">{course.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full ${course.percentage >= course.auto_threshold
                                                        ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                                        : course.percentage >= course.admission_threshold
                                                            ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                                            : "bg-gradient-to-r from-red-400 to-pink-500"
                                                    }`}
                                                style={{ width: `${Math.min(course.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-center">
                                            <p className="text-lg font-bold text-blue-600">{course.labs_done}/{course.labs_total}</p>
                                            <p className="text-xs text-blue-700">🧪 Лабы</p>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-xl text-center">
                                            <p className="text-lg font-bold text-purple-600">{course.hw_done}/{course.hw_total}</p>
                                            <p className="text-xs text-purple-700">📝 ДЗ</p>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-xl text-center">
                                            <p className="text-lg font-bold text-amber-600">{course.tests_done}/{course.tests_total}</p>
                                            <p className="text-xs text-amber-700">✅ Тесты</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl text-center">
                                            <p className="text-lg font-bold text-emerald-600">{course.attendance_percentage}%</p>
                                            <p className="text-xs text-emerald-700">📅 Посещ.</p>
                                        </div>
                                    </div>

                                    {course.exam_date && (
                                        <div className="p-3 bg-indigo-50 rounded-xl text-sm text-indigo-800">
                                            🎓 Экзамен: {new Date(course.exam_date).toLocaleString("ru")}
                                            {course.exam_room && ` • Аудитория ${course.exam_room}`}
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