"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, BookOpen, Hash, ArrowRight, X, Trash2, Star, MessageSquare } from "lucide-react";
import Logo from "@/components/Logo";

interface Course {
    id: number;
    title: string;
    description: string;
    course_code: string;
    max_score: number;
    auto_threshold: number;
    admission_threshold: number;
    planned_lectures: number;
    planned_labs: number;
    planned_hw: number;
    planned_tests: number;
    exam_date: string | null;
    exam_room: string | null;
    exam_format: string | null;
}

export default function TeacherDashboard() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [maxScore, setMaxScore] = useState(100);
    const [autoThreshold, setAutoThreshold] = useState(80);
    const [admissionThreshold, setAdmissionThreshold] = useState(50);
    const [plannedLectures, setPlannedLectures] = useState(0);
    const [plannedLabs, setPlannedLabs] = useState(0);
    const [plannedHw, setPlannedHw] = useState(0);
    const [plannedTests, setPlannedTests] = useState(0);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        const role = localStorage.getItem("role");
        const name = localStorage.getItem("full_name");

        if (!token || role !== "teacher") {
            router.push("/login");
            return;
        }

        setFullName(name || "");
        loadCourses();
    }, [router, token]);

    const loadCourses = () => {
        fetch("http://localhost:8000/courses/my", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setCourses(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setCourses([]);
                setLoading(false);
            });
    };

    const createCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCreating(true);

        try {
            const res = await fetch("http://localhost:8000/courses/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    max_score: maxScore,
                    auto_threshold: autoThreshold,
                    admission_threshold: admissionThreshold,
                    planned_lectures: plannedLectures,
                    planned_labs: plannedLabs,
                    planned_hw: plannedHw,
                    planned_tests: plannedTests,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Ошибка создания курса");
                setCreating(false);
                return;
            }

            setCourses([...courses, data]);
            setShowCreateModal(false);
            setTitle("");
            setDescription("");
            setMaxScore(100);
            setAutoThreshold(80);
            setAdmissionThreshold(50);
            setPlannedLectures(0);
            setPlannedLabs(0);
            setPlannedHw(0);
            setPlannedTests(0);
            setCreating(false);
        } catch (err) {
            setError("Ошибка соединения с сервером");
            setCreating(false);
        }
    };

    const deleteCourse = async (courseId: number, courseTitle: string) => {
        if (!confirm(`Удалить курс "${courseTitle}"?\n\nБудут удалены:\n— все группы\n— все материалы\n— все сдачи студентов`)) return;

        try {
            const res = await fetch(`http://localhost:8000/courses/${courseId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setCourses(courses.filter((c) => c.id !== courseId));
            } else {
                const data = await res.json();
                alert("Ошибка удаления: " + (data.detail || res.status));
            }
        } catch (err) {
            alert("Ошибка соединения с сервером");
        }
    };

    const logout = () => {
        localStorage.clear();
        router.push("/login");
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
                        <button
                            onClick={() => router.push("/teacher/reviews")}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/30 text-sm font-medium"
                        >
                            <Star className="w-4 h-4" />
                            Отзывы
                        </button>
                        <button
                            onClick={() => router.push("/teacher/complaints")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Жалобы
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Выйти
                        </button>
                    </div>
                </header>

                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Здравствуйте, {fullName}!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Управляйте своими дисциплинами и материалами
                    </p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Мои дисциплины</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/30 text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Создать курс
                    </button>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            У вас пока нет дисциплин
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Создайте первый курс, чтобы начать работу со студентами
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/30 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Создать первую дисциплину
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-200 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            onClick={() => router.push(`/teacher/courses/${course.id}`)}
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform cursor-pointer"
                                        >
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <button
                                            onClick={() => deleteCourse(course.id, course.title)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Удалить курс"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div
                                        onClick={() => router.push(`/teacher/courses/${course.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                            {course.description || "Без описания"}
                                        </p>

                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-mono font-semibold">
                                                <Hash className="w-3 h-3" />
                                                {course.course_code}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                                            <span>Макс: {course.max_score}</span>
                                            <span>Автомат: {course.auto_threshold}%</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all">
                                            <span>Открыть дисциплину</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative my-8">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Новая дисциплина</h2>
                            <p className="text-gray-500 text-sm mt-1">Заполните информацию о курсе</p>
                        </div>

                        <form onSubmit={createCourse} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Название *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="Программирование на Python"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Описание</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Краткое описание курса"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                                />
                            </div>

                            {/* План дисциплины */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">📋 План дисциплины</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Лекций</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={plannedLectures}
                                            onChange={(e) => setPlannedLectures(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Лабораторных</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={plannedLabs}
                                            onChange={(e) => setPlannedLabs(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">ДЗ</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={plannedHw}
                                            onChange={(e) => setPlannedHw(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Тестов</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={plannedTests}
                                            onChange={(e) => setPlannedTests(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Баллы */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-3">🎯 Баллы</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Макс балл</label>
                                        <input
                                            type="number"
                                            value={maxScore}
                                            onChange={(e) => setMaxScore(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Автомат %</label>
                                        <input
                                            type="number"
                                            value={autoThreshold}
                                            onChange={(e) => setAutoThreshold(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1 text-gray-600">Допуск %</label>
                                        <input
                                            type="number"
                                            value={admissionThreshold}
                                            onChange={(e) => setAdmissionThreshold(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
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
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-emerald-500/30"
                                >
                                    {creating ? "Создание..." : "Создать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}