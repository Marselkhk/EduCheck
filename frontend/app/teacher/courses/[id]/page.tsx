"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users, ArrowRight, X, Hash, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Group {
    id: number;
    name: string;
    course_id: number;
}

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [groups, setGroups] = useState<Group[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [courseData, setCourseData] = useState<any>(null);
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [examDate, setExamDate] = useState("");
    const [examRoom, setExamRoom] = useState("");
    const [examFormat, setExamFormat] = useState("устный");
    const [examSaving, setExamSaving] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }
        loadGroups();

        fetch(`http://localhost:8000/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setCourseData(data);
                if (data.exam_date) {
                    setExamDate(data.exam_date.slice(0, 16));
                }
                if (data.exam_room) setExamRoom(data.exam_room);
                if (data.exam_format) setExamFormat(data.exam_format);
            })
            .catch(() => { });
    }, [courseId, router, token]);

    const loadGroups = () => {
        fetch(`http://localhost:8000/courses/${courseId}/groups`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setGroups(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setGroups([]);
                setLoading(false);
            });
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setCreating(true);
        setError("");

        const res = await fetch(`http://localhost:8000/courses/${courseId}/groups`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newGroupName }),
        });

        if (res.ok) {
            const group = await res.json();
            setGroups([...groups, group]);
            setNewGroupName("");
            setShowCreateModal(false);
            setCreating(false);
        } else {
            const data = await res.json();
            setError(data.detail || "Ошибка создания группы");
            setCreating(false);
        }
    };

    const saveExam = async () => {
        setExamSaving(true);
        const res = await fetch(`http://localhost:8000/courses/${courseId}/exam`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                exam_date: examDate || null,
                exam_room: examRoom || null,
                exam_format: examFormat,
            }),
        });
        setExamSaving(false);

        if (res.ok) {
            setExamModalOpen(false);
            alert("Расписание экзамена сохранено!");
            window.location.reload();
        } else {
            alert("Ошибка сохранения");
        }
    };

    const deleteGroup = async (groupId: number, groupName: string) => {
        if (!confirm(`Удалить группу "${groupName}"? Все студенты и материалы будут удалены.`)) return;

        const res = await fetch(`http://localhost:8000/courses/${courseId}/groups/${groupId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            setGroups(groups.filter((g) => g.id !== groupId));
        } else {
            alert("Ошибка удаления группы");
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
                        onClick={() => router.push("/teacher")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад к дисциплинам
                    </button>
                </header>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Hash className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {courseData?.title || `Курс #${courseId}`}
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        {groups.length} {groups.length === 1 ? "группа" : "групп"}
                    </p>
                </div>

                {/* Блок экзамена */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white text-lg">
                                    🎓
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Экзамен</h2>
                            </div>
                            <button
                                onClick={() => setExamModalOpen(true)}
                                className="text-sm text-indigo-600 hover:underline font-medium"
                            >
                                {courseData?.exam_date ? "✏️ Изменить" : "+ Назначить"}
                            </button>
                        </div>

                        {courseData?.exam_date ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-indigo-50 rounded-xl">
                                    <p className="text-xs text-indigo-600 font-medium mb-1">📅 Дата</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {new Date(courseData.exam_date).toLocaleString("ru")}
                                    </p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-xl">
                                    <p className="text-xs text-indigo-600 font-medium mb-1">🚪 Аудитория</p>
                                    <p className="text-sm font-bold text-gray-900">{courseData.exam_room || "—"}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-xl">
                                    <p className="text-xs text-indigo-600 font-medium mb-1">📝 Формат</p>
                                    <p className="text-sm font-bold text-gray-900">{courseData.exam_format || "—"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                Экзамен ещё не назначен
                            </p>
                        )}
                    </div>
                </div>

                {/* План дисциплины */}
                {courseData && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6 relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                        <div className="relative">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 План дисциплины</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{courseData.planned_lectures}</p>
                                    <p className="text-xs text-emerald-700">Лекций</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-blue-600">{courseData.planned_labs}</p>
                                    <p className="text-xs text-blue-700">Лабораторных</p>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-purple-600">{courseData.planned_hw}</p>
                                    <p className="text-xs text-purple-700">ДЗ</p>
                                </div>
                                <div className="p-4 bg-amber-50 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-amber-600">{courseData.planned_tests}</p>
                                    <p className="text-xs text-amber-700">Тестов</p>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                                🎯 Макс. балл: <strong>{courseData.max_score}</strong> •
                                Автомат: <strong>{courseData.auto_threshold}%</strong> •
                                Допуск: <strong>{courseData.admission_threshold}%</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* Кнопка создать группу */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Группы</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Создать группу
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Групп пока нет
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Создайте первую группу, чтобы студенты могли присоединиться
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Создать первую группу
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="group bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-200 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                                <div className="relative flex items-center gap-4">
                                    <div
                                        onClick={() => router.push(`/teacher/courses/${courseId}/groups/${group.id}`)}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform cursor-pointer"
                                    >
                                        <Users className="w-6 h-6 text-white" />
                                    </div>

                                    <div
                                        onClick={() => router.push(`/teacher/courses/${courseId}/groups/${group.id}`)}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                                        <p className="text-sm text-gray-500">ID: {group.id}</p>
                                    </div>

                                    <button
                                        onClick={() => deleteGroup(group.id, group.name)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                        title="Удалить группу"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    <ArrowRight
                                        onClick={() => router.push(`/teacher/courses/${courseId}/groups/${group.id}`)}
                                        className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform cursor-pointer"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модалка создания группы */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Новая группа</h2>
                            <p className="text-gray-500 text-sm mt-1">Введите название группы</p>
                        </div>

                        <form onSubmit={createGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Название *</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    required
                                    autoFocus
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
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-blue-500/30"
                                >
                                    {creating ? "Создание..." : "Создать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка экзамена */}
            {examModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setExamModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">🎓 Расписание экзамена</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Дата и время</label>
                                <input
                                    type="datetime-local"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Аудитория</label>
                                <input
                                    type="text"
                                    value={examRoom}
                                    onChange={(e) => setExamRoom(e.target.value)}
                                    placeholder="305"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Формат</label>
                                <select
                                    value={examFormat}
                                    onChange={(e) => setExamFormat(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="устный">Устный</option>
                                    <option value="письменный">Письменный</option>
                                    <option value="онлайн">Онлайн</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setExamModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={saveExam}
                                    disabled={examSaving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-indigo-500/30"
                                >
                                    {examSaving ? "Сохранение..." : "Сохранить"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}