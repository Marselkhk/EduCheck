"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, Shield, Save } from "lucide-react";
import Logo from "@/components/Logo";

interface Student {
    user_id: number;
    email: string;
    full_name: string;
}

interface AttendanceRecord {
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    status: string;
    note: string | null;
}

export default function AttendancePage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const groupId = params.groupId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().slice(0, 10)
    );
    const [marks, setMarks] = useState<Record<number, string>>({});
    const [existingMarks, setExistingMarks] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        // Загружаем студентов
        fetch(`http://localhost:8000/courses/${courseId}/groups/${groupId}/students`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setStudents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        // Загружаем существующие отметки
        fetch(`http://localhost:8000/attendance/group/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setExistingMarks(Array.isArray(data) ? data : []);
            })
            .catch(() => { });
    }, [courseId, groupId, router, token]);

    // При выборе даты — подставляем существующие отметки
    useEffect(() => {
        if (!existingMarks.length || !selectedDate) return;

        const newMarks: Record<number, string> = {};
        existingMarks.forEach((m) => {
            const mDate = new Date(m.date).toISOString().slice(0, 10);
            if (mDate === selectedDate) {
                newMarks[m.student_id] = m.status;
            }
        });
        setMarks(newMarks);
    }, [selectedDate, existingMarks]);

    const setMark = (studentId: number, status: string) => {
        setMarks({ ...marks, [studentId]: status });
    };

    const setAllMark = (status: string) => {
        const newMarks: Record<number, string> = {};
        students.forEach((s) => {
            newMarks[s.user_id] = status;
        });
        setMarks(newMarks);
    };

    const saveAll = async () => {
        if (Object.keys(marks).length === 0) {
            alert("Поставьте хотя бы одну отметку");
            return;
        }

        setSaving(true);

        try {
            const promises = Object.entries(marks).map(([studentId, status]) =>
                fetch("http://localhost:8000/attendance/mark", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        student_id: Number(studentId),
                        group_id: Number(groupId),
                        date: `${selectedDate}T00:00:00`,
                        status,
                    }),
                })
            );

            await Promise.all(promises);

            // Перезагружаем
            const res = await fetch(`http://localhost:8000/attendance/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setExistingMarks(Array.isArray(data) ? data : []);

            alert("Посещаемость сохранена!");
        } catch (e) {
            alert("Ошибка сохранения");
        }
        setSaving(false);
    };

    const statusInfo = (status: string) => {
        switch (status) {
            case "present": return { label: "Был", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-300", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "absent": return { label: "Не был", color: "text-red-600", bg: "bg-red-50", border: "border-red-300", icon: <XCircle className="w-4 h-4" /> };
            case "late": return { label: "Опоздал", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-300", icon: <Clock className="w-4 h-4" /> };
            case "excused": return { label: "Уважительная", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-300", icon: <Shield className="w-4 h-4" /> };
            default: return { label: "—", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-200", icon: null };
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
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push(`/teacher/courses/${courseId}/groups/${groupId}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад к группе
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">📅 Посещаемость</h1>
                    <p className="text-gray-600 mt-1">Отметьте студентов за выбранную дату</p>
                </div>

                {/* Выбор даты */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-1">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setAllMark("present")}
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition text-sm font-medium border border-emerald-200"
                            >
                                ✅ Все были
                            </button>
                            <button
                                onClick={() => setAllMark("absent")}
                                className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition text-sm font-medium border border-red-200"
                            >
                                ❌ Всех нет
                            </button>
                        </div>
                    </div>
                </div>

                {/* Список студентов */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Студенты ({students.length})
                    </h2>

                    {students.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">В группе нет студентов</p>
                    ) : (
                        <div className="space-y-3">
                            {students.map((s) => {
                                const current = marks[s.user_id];
                                const status = statusInfo(current);

                                return (
                                    <div
                                        key={s.user_id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition ${current ? `${status.bg} ${status.border}` : "bg-white border-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                {s.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{s.full_name}</p>
                                                <p className="text-xs text-gray-500">{s.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setMark(s.user_id, "present")}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${current === "present"
                                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                        : "bg-gray-100 text-gray-600 hover:bg-emerald-50"
                                                    }`}
                                                title="Был"
                                            >
                                                ✅
                                            </button>
                                            <button
                                                onClick={() => setMark(s.user_id, "absent")}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${current === "absent"
                                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                                        : "bg-gray-100 text-gray-600 hover:bg-red-50"
                                                    }`}
                                                title="Не был"
                                            >
                                                ❌
                                            </button>
                                            <button
                                                onClick={() => setMark(s.user_id, "late")}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${current === "late"
                                                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                                                        : "bg-gray-100 text-gray-600 hover:bg-amber-50"
                                                    }`}
                                                title="Опоздал"
                                            >
                                                ⏰
                                            </button>
                                            <button
                                                onClick={() => setMark(s.user_id, "excused")}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${current === "excused"
                                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                                        : "bg-gray-100 text-gray-600 hover:bg-blue-50"
                                                    }`}
                                                title="Уважительная"
                                            >
                                                📄
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Сохранить */}
                <button
                    onClick={saveAll}
                    disabled={saving || Object.keys(marks).length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? "Сохранение..." : `Сохранить посещаемость (${Object.keys(marks).length})`}
                </button>

                {/* Кнопка "Дневник студента" */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-800">
                    💡 <strong>Совет:</strong> Открой <strong>дневник студента</strong> на странице группы, чтобы увидеть всю историю.
                </div>
            </div>
        </main>
    );
}