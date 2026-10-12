"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Deadline {
    id: number;
    title: string;
    type: string;
    deadline: string;
    course_title: string;
    group_id: number;
    submitted: boolean;
    score: number | null;
}

interface Discipline {
    student_id: number;
    group_id: number;
    group_name: string;
    course_title: string;
}

export default function CalendarPage() {
    const router = useRouter();
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        // Получаем дисциплины студента
        fetch("http://localhost:8000/students/my-disciplines", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then(async (disciplines: Discipline[]) => {
                if (!Array.isArray(disciplines)) {
                    setLoading(false);
                    return;
                }

                // По каждой дисциплине — получаем материалы
                const allPromises = disciplines.map((d) =>
                    fetch(`http://localhost:8000/materials/my-materials?group_id=${d.group_id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then((res) => res.json())
                        .then((materials) => {
                            if (!Array.isArray(materials)) return [];
                            return materials
                                .filter((m: any) => m.deadline && m.type !== "lecture")
                                .map((m: any) => ({
                                    id: m.id,
                                    title: m.title,
                                    type: m.type,
                                    deadline: m.deadline,
                                    course_title: d.course_title,
                                    group_id: d.group_id,
                                    submitted: m.submitted,
                                    score: m.score,
                                }));
                        })
                        .catch(() => [])
                );

                const results = await Promise.all(allPromises);
                const allDeadlines = results.flat();

                // Сортируем по дате
                allDeadlines.sort(
                    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
                );

                setDeadlines(allDeadlines);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    const typeLabel = (type: string) => {
        switch (type) {
            case "lab": return "🧪 Лабораторная";
            case "hw": return "📝 Домашнее задание";
            case "test": return "✅ Тест";
            default: return type;
        }
    };

    const getStatus = (deadline: Deadline) => {
        if (deadline.submitted) {
            return {
                label: "Сдано",
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                icon: <CheckCircle2 className="w-5 h-5" />,
            };
        }

        const now = new Date();
        const dl = new Date(deadline.deadline);
        const diff = dl.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (diff < 0) {
            return {
                label: "Просрочено",
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-200",
                icon: <AlertCircle className="w-5 h-5" />,
                days,
                hours,
            };
        }

        if (days === 0 && hours < 24) {
            return {
                label: `Сегодня (осталось ${hours} ч)`,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-200",
                icon: <Clock className="w-5 h-5" />,
                days,
                hours,
            };
        }

        return {
            label: `Через ${days} дн.`,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            icon: <Calendar className="w-5 h-5" />,
            days,
            hours,
        };
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
                        onClick={() => router.push("/student")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Календарь дедлайнов</h1>
                    <p className="text-gray-600 mt-1">
                        {deadlines.length} {deadlines.length === 1 ? "задание" : "заданий"}
                    </p>
                </div>

                {deadlines.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Дедлайнов пока нет
                        </h3>
                        <p className="text-gray-600">
                            Как только преподаватель выложит задание с дедлайном — оно появится здесь.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deadlines.map((d) => {
                            const status = getStatus(d);
                            return (
                                <div
                                    key={`${d.group_id}-${d.id}`}
                                    onClick={() => router.push(`/student/discipline/${d.group_id}`)}
                                    className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border ${status.border} p-5 hover:shadow-xl transition-all cursor-pointer`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                                                    {typeLabel(d.type)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {d.course_title}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900">{d.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                📅 Дедлайн: {new Date(d.deadline).toLocaleString("ru")}
                                            </p>
                                        </div>

                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${status.bg} ${status.color} font-medium text-sm whitespace-nowrap`}>
                                            {status.icon}
                                            {status.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}