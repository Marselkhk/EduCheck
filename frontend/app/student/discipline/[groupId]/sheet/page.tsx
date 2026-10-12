"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface Material {
    id: number;
    title: string;
    type: string;
    max_score: number;
    attempts_left: number;
    score: number | null;
    status: string;
    deadline: string | null;
}

interface Progress {
    total_score: number;
    max_possible: number;
    percentage: number;
    status: string;
    auto_threshold: number;
    admission_threshold: number;
    labs_total: number;
    labs_done: number;
    hw_total: number;
    hw_done: number;
    tests_total: number;
    tests_done: number;
}

interface CourseInfo {
    course_title: string;
    course_code: string;
    group_name: string;
    exam_date: string | null;
    exam_room: string | null;
    exam_format: string | null;
}

export default function ExamSheetPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [materials, setMaterials] = useState<Material[]>([]);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        setFullName(localStorage.getItem("full_name") || "");

        Promise.all([
            fetch(`http://localhost:8000/materials/my-materials?group_id=${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch(`http://localhost:8000/students/my-progress/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch(`http://localhost:8000/students/course-info/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
        ])
            .then(([materialsData, progressData, courseData]) => {
                setMaterials(Array.isArray(materialsData) ? materialsData : []);
                setProgress(progressData);
                setCourseInfo(courseData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [groupId, router, token]);

    const typeLabel = (type: string) => {
        switch (type) {
            case "lab": return "Лабораторная";
            case "hw": return "Домашнее задание";
            case "test": return "Тест";
            case "lecture": return "Лекция";
            default: return type;
        }
    };

    const statusInfo = (status: string) => {
        switch (status) {
            case "automatic":
                return { label: "АВТОМАТ", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300", icon: <CheckCircle2 className="w-5 h-5" /> };
            case "admitted":
                return { label: "ДОПУСК", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", icon: <AlertCircle className="w-5 h-5" /> };
            case "not_admitted":
                return { label: "НЕДОПУСК", color: "text-red-700", bg: "bg-red-50", border: "border-red-300", icon: <XCircle className="w-5 h-5" /> };
            default:
                return { label: "Не выставлен", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-300", icon: null };
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    const status = progress ? statusInfo(progress.status) : null;

    const gradeableMaterials = materials.filter((m) => m.type !== "lecture");

    return (
        <main className="min-h-screen p-6 lg:p-8 print:p-0">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-6 print:hidden">
                    <Logo />
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/30 text-sm font-medium"
                        >
                            <Printer className="w-4 h-4" />
                            Скачать PDF
                        </button>
                        <button
                            onClick={() => router.push(`/student/discipline/${groupId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Назад
                        </button>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 print:shadow-none print:border-0">
                    <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            ЭКЗАМЕНАЦИОННЫЙ ЛИСТ
                        </h1>
                        <p className="text-gray-600">
                            {courseInfo?.course_title || "Дисциплина"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Код курса: <span className="font-mono font-semibold">{courseInfo?.course_code}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Студент</p>
                            <p className="font-bold text-gray-900">{fullName}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Группа</p>
                            <p className="font-bold text-gray-900">{courseInfo?.group_name}</p>
                        </div>
                    </div>

                    <table className="w-full mb-6 border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b-2 border-gray-300">Тип</th>
                                <th className="text-left py-3 px-4 font-bold text-gray-700 text-sm border-b-2 border-gray-300">Название</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm border-b-2 border-gray-300">Макс.</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm border-b-2 border-gray-300">Балл</th>
                                <th className="text-center py-3 px-4 font-bold text-gray-700 text-sm border-b-2 border-gray-300">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gradeableMaterials.map((m) => (
                                <tr key={m.id} className="border-b border-gray-100">
                                    <td className="py-3 px-4 text-sm text-gray-600">{typeLabel(m.type)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{m.title}</td>
                                    <td className="py-3 px-4 text-sm text-center text-gray-600">{m.max_score}</td>
                                    <td className="py-3 px-4 text-sm text-center font-bold">
                                        {m.score !== null ? (
                                            <span className={
                                                m.score >= m.max_score * 0.8
                                                    ? "text-emerald-600"
                                                    : m.score >= m.max_score * 0.5
                                                        ? "text-amber-600"
                                                        : "text-red-600"
                                            }>
                                                {m.score}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-center">
                                        {m.score !== null ? (
                                            <span className="text-emerald-600">✓ Сдано</span>
                                        ) : m.status === "pending" ? (
                                            <span className="text-amber-600">⏳ На проверке</span>
                                        ) : (
                                            <span className="text-red-600">✗ Не сдано</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 border-t-2 border-gray-300">
                                <td colSpan={2} className="py-3 px-4 text-right font-bold text-gray-900">ИТОГО:</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-900">{progress?.max_possible}</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-900 text-lg">{progress?.total_score}</td>
                                <td className="py-3 px-4 text-center font-bold text-gray-900">{progress?.percentage}%</td>
                            </tr>
                        </tfoot>
                    </table>

                    {progress && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="p-4 bg-blue-50 rounded-xl text-center">
                                <p className="text-sm text-blue-600 mb-1">Лабораторные</p>
                                <p className="text-2xl font-bold text-blue-700">{progress.labs_done} / {progress.labs_total}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-xl text-center">
                                <p className="text-sm text-purple-600 mb-1">ДЗ</p>
                                <p className="text-2xl font-bold text-purple-700">{progress.hw_done} / {progress.hw_total}</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-xl text-center">
                                <p className="text-sm text-amber-600 mb-1">Тесты</p>
                                <p className="text-2xl font-bold text-amber-700">{progress.tests_done} / {progress.tests_total}</p>
                            </div>
                        </div>
                    )}

                    {status && progress && (
                        <div className={`p-6 rounded-2xl border-2 ${status.bg} ${status.border} mb-6`}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    {status.icon}
                                    <div>
                                        <p className="text-sm text-gray-600">Итоговый статус</p>
                                        <p className={`text-2xl font-bold ${status.color}`}>{status.label}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-bold text-gray-900">{progress.percentage}%</p>
                                    <p className="text-sm text-gray-500">{progress.total_score} / {progress.max_possible} баллов</p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-white/60 rounded-lg">
                                    <p className="text-gray-600">Автомат с</p>
                                    <p className="font-bold text-emerald-600">{progress.auto_threshold}%</p>
                                </div>
                                <div className="p-3 bg-white/60 rounded-lg">
                                    <p className="text-gray-600">Допуск с</p>
                                    <p className="font-bold text-amber-600">{progress.admission_threshold}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {courseInfo?.exam_date && (
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 mb-6">
                            <h3 className="font-bold text-gray-900 mb-3">🎓 Экзамен</h3>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-1">Дата</p>
                                    <p className="font-bold text-gray-900">
                                        {new Date(courseInfo.exam_date).toLocaleString("ru", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Аудитория</p>
                                    <p className="font-bold text-gray-900">{courseInfo.exam_room || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-1">Формат</p>
                                    <p className="font-bold text-gray-900">{courseInfo.exam_format || "—"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-end mt-12 pt-6 border-t-2 border-gray-200">
                        <div>
                            <p className="text-sm text-gray-500 mb-8">Дата формирования:</p>
                            <p className="text-sm text-gray-900 font-medium">
                                {new Date().toLocaleDateString("ru")}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-8">Подпись преподавателя:</p>
                            <div className="w-48 border-b-2 border-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}