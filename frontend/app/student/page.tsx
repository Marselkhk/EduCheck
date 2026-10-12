"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, BookOpen, Hash, ArrowRight, X, Users, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import NotificationBell from "@/components/NotificationBell";

interface Discipline {
    student_id: number;
    group_id: number;
    group_name: string;
    course_id: number;
    course_title: string;
    course_code: string;
    teacher_name: string;
    status: string;
}

export default function StudentDashboard() {
    const router = useRouter();
    const [disciplines, setDisciplines] = useState<Discipline[]>([]);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const [courseCode, setCourseCode] = useState("");
    const [groupName, setGroupName] = useState("");
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        const role = localStorage.getItem("role");
        const name = localStorage.getItem("full_name");

        if (!token || role !== "student") {
            router.push("/login");
            return;
        }

        setFullName(name || "");
        loadDisciplines();
    }, [router, token]);

    const loadDisciplines = () => {
        fetch("http://localhost:8000/students/my-disciplines", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setDisciplines(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setDisciplines([]);
                setLoading(false);
            });
    };

    const joinDiscipline = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setJoining(true);

        try {
            const res = await fetch("http://localhost:8000/students/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    course_code: courseCode.toUpperCase(),
                    group_name: groupName,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Ошибка присоединения");
                setJoining(false);
                return;
            }

            setShowJoinModal(false);
            setCourseCode("");
            setGroupName("");
            setJoining(false);
            loadDisciplines();
        } catch (err) {
            setError("Ошибка соединения с сервером");
            setJoining(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "automatic":
                return { label: "Автомат", color: "text-emerald-700", bg: "bg-emerald-50", icon: "✅ " };
            case "admitted":
                return { label: "Допуск", color: "text-amber-700", bg: "bg-amber-50", icon: "⚠️ " };
            case "not_admitted":
                return { label: "Недопуск", color: "text-red-700", bg: "bg-red-50", icon: "❌ " };
            default:
                return { label: "Не выставлен", color: "text-gray-600", bg: "bg-gray-100", icon: "⏳ " };
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
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <Logo />
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Выйти
                        </button>
                        <button
                            onClick={() => router.push("/student/profile")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            👤 Портфолио
                        </button>
                        <button
                            onClick={() => router.push("/student/diary")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            📔 Дневник
                        </button>
                    </div>
                </header>

                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Здравствуйте, {fullName}!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Ваши дисциплины и материалы
                    </p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Мои дисциплины</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push("/student/calendar")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Календарь
                        </button>
                        <button
                            onClick={() => router.push("/student/grades")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <BookOpen className="w-4 h-4" />
                            Зачётка
                        </button>
                        <button
                            onClick={() => router.push("/student/complaints")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <AlertCircle className="w-4 h-4" />
                            Жалобы
                        </button>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Присоединиться
                        </button>
                    </div>
                </div>

                {disciplines.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            У вас пока нет дисциплин
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Присоединитесь к дисциплине по коду курса, который дал преподаватель
                        </p>
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Присоединиться к дисциплине
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {disciplines.map((d) => {
                            const statusInfo = getStatusInfo(d.status);
                            return (
                                <div
                                    key={d.student_id}
                                    onClick={() => router.push(`/student/discipline/${d.group_id}`)}
                                    className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-200 transition-all duration-300 overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                                    <div className="relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                                <BookOpen className="w-6 h-6 text-white" />
                                            </div>

                                            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                                            {d.course_title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Users className="w-4 h-4" />
                                                Группа: {d.group_name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Преподаватель: {d.teacher_name}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold">
                                                <Hash className="w-3 h-3" />
                                                {d.course_code}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
                                            <span>Открыть дисциплину</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showJoinModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowJoinModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Присоединиться</h2>
                            <p className="text-gray-500 text-sm mt-1">Введите код курса и название группы</p>
                        </div>

                        <form onSubmit={joinDiscipline} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Код курса *</label>
                                <input
                                    type="text"
                                    value={courseCode}
                                    onChange={(e) => setCourseCode(e.target.value)}
                                    required
                                    placeholder="QTM9V0"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Название группы *</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    required
                                    placeholder="ПИ-101"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {error && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={joining}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-blue-500/30"
                                >
                                    {joining ? "Присоединение..." : "Присоединиться"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}