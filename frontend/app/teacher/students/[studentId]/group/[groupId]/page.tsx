"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, BookOpen, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";
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

export default function StudentDiaryPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;
    const groupId = params.groupId as string;

    const [diary, setDiary] = useState<DiaryData | null>(null);
    const [studentName, setStudentName] = useState("");
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`http://localhost:8000/attendance/student/${studentId}/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setDiary(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [studentId, groupId, router, token]);

    const statusInfo = (status: string) => {
        switch (status) {
            case "present": return { label: "Был", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "absent": return { label: "Не был", color: "text-red-600", bg: "bg-red-50", icon: <XCircle className="w-4 h-4" /> };
            case "late": return { label: "Опоздал", color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="w-4 h-4" /> };
            case "excused": return { label: "Уважительная", color: "text-blue-600", bg: "bg-blue-50", icon: <Shield className="w-4 h-4" /> };
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
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">📔 Дневник студента</h1>
                    <p className="text-gray-600 mt-1">Посещаемость и сдачи</p>
                </div>

                {!diary ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <p className="text-gray-500">Нет данных</p>
                    </div>
                ) : (
                    <>
                        {/* Статистика */}
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

                        {/* Посещаемость */}
                        {diary.attendance.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Посещаемость ({diary.attendance.length})
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
                                                    <p className="font-medium text-gray-900">
                                                        {new Date(a.date).toLocaleDateString("ru", {
                                                            day: "2-digit",
                                                            month: "long",
                                                            year: "numeric",
                                                        })}
                                                    </p>
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
                                    Сдачи ({diary.submissions.length})
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