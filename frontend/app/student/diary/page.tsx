"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, BookOpen, CheckCircle2, XCircle, Clock } from "lucide-react";
import Logo from "@/components/Logo";

interface AttendanceRecord {
    date: string;
    status: string;
    note: string | null;
}

interface SubmissionRecord {
    material_title: string;
    material_type: string;
    submitted_at: string;
    score: number | null;
    max_score: number;
    status: string;
}

interface DiaryData {
    attendance: AttendanceRecord[];
    submissions: SubmissionRecord[];
    stats: {
        total: number;
        present: number;
        absent: number;
        late: number;
        attendance_percentage: number;
    };
}

interface Discipline {
    student_id: number;
    group_id: number;
    group_name: string;
    course_title: string;
}

export default function DiaryPage() {
    const router = useRouter();
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
    const [diary, setDiary] = useState<DiaryData | null>(null);
    const [myId, setMyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        Promise.all([
            fetch("http://localhost:8000/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch("http://localhost:8000/students/my-disciplines", {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
        ])
            .then(([user, discData]) => {
                setMyId(user.id);
                const list = Array.isArray(discData) ? discData : [];
                setDisciplines(list);
                if (list.length > 0) {
                    setSelectedGroup(list[0].group_id);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    useEffect(() => {
        if (!selectedGroup || !myId || !token) return;

        fetch(`http://localhost:8000/attendance/student/${myId}/group/${selectedGroup}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setDiary(data))
            .catch(() => { });
    }, [selectedGroup, myId, token]);

    const statusInfo = (status: string) => {
        switch (status) {
            case "present": return { label: "Был", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "absent": return { label: "Не был", color: "text-red-600", bg: "bg-red-50", icon: <XCircle className="w-4 h-4" /> };
            case "late": return { label: "Опоздал", color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="w-4 h-4" /> };
            case "excused": return { label: "Уважительная", color: "text-blue-600", bg: "bg-blue-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            default: return { label: status, color: "text-gray-600", bg: "bg-gray-50", icon: null };
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

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
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
                    <h1 className="text-3xl font-bold text-gray-900">📔 Мой дневник</h1>
                    <p className="text-gray-600 mt-1">Посещаемость и сдачи по дисциплинам</p>
                </div>

                {/* Выбор дисциплины */}
                {disciplines.length > 1 && (
                    <div className="mb-6 flex gap-2 flex-wrap">
                        {disciplines.map((d) => (
                            <button
                                key={d.group_id}
                                onClick={() => setSelectedGroup(d.group_id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedGroup === d.group_id
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-white/70 backdrop-blur border border-gray-200 text-gray-700 hover:bg-white"
                                    }`}
                            >
                                {d.course_title}
                            </button>
                        ))}
                    </div>
                )}

                {!diary ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Дневник пуст</h3>
                        <p className="text-gray-600">Нет данных о посещаемости и сдачах</p>
                    </div>
                ) : (
                    <>
                        {/* Статистика посещаемости */}
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">📊 Посещаемость</h2>
                                <p className="text-3xl font-bold">{diary.stats.attendance_percentage}%</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center">
                                    <p className="text-2xl font-bold">{diary.stats.present}</p>
                                    <p className="text-xs text-blue-100">Был</p>
                                </div>
                                <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center">
                                    <p className="text-2xl font-bold">{diary.stats.absent}</p>
                                    <p className="text-xs text-blue-100">Не был</p>
                                </div>
                                <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center">
                                    <p className="text-2xl font-bold">{diary.stats.late}</p>
                                    <p className="text-xs text-blue-100">Опоздал</p>
                                </div>
                            </div>
                        </div>

                        {/* Посещаемость — список */}
                        {diary.attendance.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Посещаемость
                                </h2>
                                <div className="space-y-2">
                                    {diary.attendance.map((a, i) => {
                                        const s = statusInfo(a.status);
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.bg} ${s.color}`}>
                                                        {s.icon}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {new Date(a.date).toLocaleDateString("ru", {
                                                                day: "2-digit",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                        {a.note && (
                                                            <p className="text-xs text-gray-500">{a.note}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${s.bg} ${s.color}`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Сдачи */}
                        {diary.submissions.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-purple-600" />
                                    Сдачи
                                </h2>
                                <div className="space-y-2">
                                    {diary.submissions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{s.material_title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {typeLabel(s.material_type)} •{" "}
                                                    {new Date(s.submitted_at).toLocaleString("ru")}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {s.score !== null ? (
                                                    <p className="text-lg font-bold text-emerald-600">
                                                        {s.score} / {s.max_score}
                                                    </p>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600">
                                                        ⏳ На проверке
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}