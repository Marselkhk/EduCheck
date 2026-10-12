"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Upload, FileText, FlaskConical, BookOpen, ClipboardList, CheckCircle2, Clock, XCircle, MessageCircle, Star } from "lucide-react";
import Logo from "@/components/Logo";

interface Material {
    id: number;
    title: string;
    type: string;
    description: string | null;
    max_score: number;
    max_attempts: number;
    extra_attempts: number;
    attempts_left: number;
    is_final: boolean;
    opens_at: string;
    deadline: string | null;
    closes_at: string | null;
    submitted: boolean;
    submission_id: number | null;
    score: number | null;
    status: string;
    teacher_comment: string | null;
}

export default function DisciplinePage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    const [notesModalOpen, setNotesModalOpen] = useState(false);
    const [noteMaterialId, setNoteMaterialId] = useState<number | null>(null);
    const [noteMaterialTitle, setNoteMaterialTitle] = useState("");
    const [noteText, setNoteText] = useState("");
    const [noteSaving, setNoteSaving] = useState(false);

    const [complaintModalOpen, setComplaintModalOpen] = useState(false);
    const [complaintSubmissionId, setComplaintSubmissionId] = useState<number | null>(null);
    const [complaintMaterialTitle, setComplaintMaterialTitle] = useState("");
    const [complaintText, setComplaintText] = useState("");
    const [complaintSaving, setComplaintSaving] = useState(false);
    const [complaintSubmitted, setComplaintSubmitted] = useState(false);
    const [hasComplaint, setHasComplaint] = useState<Record<number, boolean>>({});
    const [courseInfo, setCourseInfo] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const checkComplaints = async () => {
        if (!token) return;
        try {
            const res = await fetch("http://localhost:8000/complaints/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const map: Record<number, boolean> = {};
                data.forEach((c: any) => {
                    map[c.submission_id] = true;
                });
                setHasComplaint(map);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`http://localhost:8000/materials/my-materials?group_id=${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setMaterials(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));

        fetch(`http://localhost:8000/students/course-info/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setCourseInfo(data))
            .catch(() => { });

        fetch(`http://localhost:8000/students/my-progress/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setProgress(data))
            .catch(() => { });

        checkComplaints();
    }, [groupId, router, token]);

    const downloadMaterial = async (materialId: number, title: string) => {
        try {
            const infoRes = await fetch(`http://localhost:8000/materials/${materialId}/file-info`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let filename = title;
            if (infoRes.ok) {
                const info = await infoRes.json();
                filename = info.filename;
            }

            const res = await fetch(`http://localhost:8000/materials/${materialId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                alert("Ошибка скачивания");
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Ошибка соединения");
        }
    };

    const openNotesModal = async (materialId: number, title: string) => {
        setNoteMaterialId(materialId);
        setNoteMaterialTitle(title);
        setNoteText("");
        setNotesModalOpen(true);

        const res = await fetch(`http://localhost:8000/notes/material/${materialId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json();
            if (data && data.text) {
                setNoteText(data.text);
            }
        }
    };

    const saveNote = async () => {
        if (!noteMaterialId || !noteText.trim()) return;

        setNoteSaving(true);
        const res = await fetch("http://localhost:8000/notes/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                material_id: noteMaterialId,
                text: noteText,
            }),
        });

        setNoteSaving(false);

        if (res.ok) {
            setNotesModalOpen(false);
            setNoteText("");
        } else {
            alert("Ошибка сохранения");
        }
    };

    const openComplaintModal = (submissionId: number, title: string) => {
        setComplaintSubmissionId(submissionId);
        setComplaintMaterialTitle(title);
        setComplaintText("");
        setComplaintSubmitted(false);
        setComplaintModalOpen(true);
    };

    const submitComplaint = async () => {
        if (!complaintSubmissionId || !complaintText.trim()) return;

        setComplaintSaving(true);
        const res = await fetch("http://localhost:8000/complaints/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                submission_id: complaintSubmissionId,
                text: complaintText,
            }),
        });

        setComplaintSaving(false);

        if (res.ok) {
            setComplaintSubmitted(true);
            if (complaintSubmissionId) {
                setHasComplaint({ ...hasComplaint, [complaintSubmissionId]: true });
            }
            setTimeout(() => {
                setComplaintModalOpen(false);
                setComplaintSubmitted(false);
            }, 2000);
        } else {
            const data = await res.json();
            alert(data.detail || "Ошибка отправки");
        }
    };

    const typeLabel = (type: string) => {
        switch (type) {
            case "lecture": return "Лекция";
            case "lab": return "Лабораторная";
            case "hw": return "Домашнее задание";
            case "test": return "Тест";
            default: return type;
        }
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case "lecture": return <BookOpen className="w-5 h-5" />;
            case "lab": return <FlaskConical className="w-5 h-5" />;
            case "hw": return <FileText className="w-5 h-5" />;
            case "test": return <ClipboardList className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const statusInfo = (status: string) => {
        switch (status) {
            case "not_submitted":
                return { label: "Не сдано", color: "text-gray-500", bg: "bg-gray-100", icon: <XCircle className="w-4 h-4" /> };
            case "pending":
                return { label: "На проверке", color: "text-amber-600", bg: "bg-amber-50", icon: <Clock className="w-4 h-4" /> };
            case "graded":
                return { label: "Оценено", color: "text-emerald-600", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            default:
                return { label: status, color: "text-gray-500", bg: "bg-gray-100", icon: null };
        }
    };

    const isClosed = (m: Material) => {
        const now = new Date();
        if (m.closes_at && now > new Date(m.closes_at)) return true;
        if (m.deadline && now > new Date(m.deadline)) return true;
        return false;
    };
    const daysUntilExam = () => {
        if (!courseInfo?.exam_date) return null;
        const now = new Date();
        const exam = new Date(courseInfo.exam_date);
        const diff = exam.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };
    const progressStatusInfo = (status: string) => {
        switch (status) {
            case "automatic":
                return { label: "✅ АВТОМАТ", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "from-emerald-400 to-teal-500" };
            case "admitted":
                return { label: "⚠️ ДОПУСК", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", bar: "from-amber-400 to-orange-500" };
            case "not_admitted":
                return { label: "❌ НЕДОПУСК", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", bar: "from-red-400 to-pink-500" };
            default:
                return { label: "Статус не выставлен", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", bar: "from-gray-400 to-gray-500" };
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => router.push(`/student/discipline/${groupId}/chat`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/30 text-sm font-medium"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Общение
                        </button>
                        <button
                            onClick={() => router.push(`/student/discipline/${groupId}/sheet`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            📄 Зачётный лист
                        </button>
                        <button
                            onClick={() => router.push(`/student/discipline/${groupId}/review`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition shadow-lg shadow-amber-500/30 text-sm font-medium"
                        >
                            <Star className="w-4 h-4" />
                            Оценить
                        </button>
                        <button
                            onClick={() => router.push("/student")}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Назад
                        </button>
                    </div>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Материалы дисциплины</h1>
                    <p className="text-gray-600 mt-1">{materials.length} материалов</p>
                </div>

                {/* Блок экзамена */}
                {courseInfo?.exam_date && (
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white relative overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative">
                            <div className="flex justify-between items-start gap-4 flex-wrap">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🎓</span>
                                        <h2 className="text-2xl font-bold">Экзамен</h2>
                                    </div>
                                    <p className="text-indigo-100 text-sm">
                                        {courseInfo.course_title}
                                    </p>
                                </div>
                                {/* Прогресс успеваемости */}
                                {progress && (
                                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6 relative overflow-hidden">
                                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white text-lg">
                                                        📊
                                                    </div>
                                                    <h2 className="text-xl font-bold text-gray-900">Моя успеваемость</h2>
                                                </div>

                                                {(() => {
                                                    const s = progressStatusInfo(progress.status);
                                                    return (
                                                        <span className={`px-4 py-2 rounded-full font-bold text-sm ${s.bg} ${s.color} border ${s.border}`}>
                                                            {s.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Процент */}
                                            <div className="mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm text-gray-600">
                                                        Набрано: <strong className="text-gray-900">{progress.total_score}</strong> из {progress.max_possible}
                                                    </span>
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {progress.percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${progressStatusInfo(progress.status).bar} transition-all duration-700`}
                                                        style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Что сдано */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 bg-blue-50 rounded-xl text-center">
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {progress.labs_done} / {progress.labs_total}
                                                    </p>
                                                    <p className="text-xs text-blue-700">🧪 Лабы</p>
                                                </div>
                                                <div className="p-3 bg-purple-50 rounded-xl text-center">
                                                    <p className="text-lg font-bold text-purple-600">
                                                        {progress.hw_done} / {progress.hw_total}
                                                    </p>
                                                    <p className="text-xs text-purple-700">📝 ДЗ</p>
                                                </div>
                                                <div className="p-3 bg-amber-50 rounded-xl text-center">
                                                    <p className="text-lg font-bold text-amber-600">
                                                        {progress.tests_done} / {progress.tests_total}
                                                    </p>
                                                    <p className="text-xs text-amber-700">✅ Тесты</p>
                                                </div>
                                            </div>

                                            {/* Что сдать */}
                                            {(progress.labs_total - progress.labs_done > 0 ||
                                                progress.hw_total - progress.hw_done > 0 ||
                                                progress.tests_total - progress.tests_done > 0) && (
                                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                                                        📌 Осталось сдать:
                                                        {progress.labs_total - progress.labs_done > 0 && ` ${progress.labs_total - progress.labs_done} лаб`}
                                                        {progress.hw_total - progress.hw_done > 0 && ` ${progress.hw_total - progress.hw_done} ДЗ`}
                                                        {progress.tests_total - progress.tests_done > 0 && ` ${progress.tests_total - progress.tests_done} тестов`}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {daysUntilExam() !== null && daysUntilExam()! >= 0 && (
                                    <div className="text-right">
                                        <p className="text-sm text-indigo-100 mb-1">До экзамена</p>
                                        <p className="text-5xl font-bold">{daysUntilExam()}</p>
                                        <p className="text-sm text-indigo-100">
                                            {daysUntilExam() === 1 ? "день" : daysUntilExam()! < 5 ? "дня" : "дней"}
                                        </p>
                                    </div>
                                )}

                                {daysUntilExam() !== null && daysUntilExam()! < 0 && (
                                    <div className="text-right">
                                        <span className="px-4 py-2 bg-white/20 rounded-xl text-sm font-medium">
                                            Экзамен прошёл
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-6">
                                <div className="p-4 bg-white/10 backdrop-blur rounded-xl">
                                    <p className="text-xs text-indigo-100 mb-1">📅 Дата</p>
                                    <p className="text-sm font-bold">
                                        {new Date(courseInfo.exam_date).toLocaleString("ru", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/10 backdrop-blur rounded-xl">
                                    <p className="text-xs text-indigo-100 mb-1">🚪 Аудитория</p>
                                    <p className="text-sm font-bold">{courseInfo.exam_room || "—"}</p>
                                </div>
                                <div className="p-4 bg-white/10 backdrop-blur rounded-xl">
                                    <p className="text-xs text-indigo-100 mb-1">📝 Формат</p>
                                    <p className="text-sm font-bold">{courseInfo.exam_format || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {materials.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center text-gray-500">
                        Материалов пока нет.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {materials.map((m) => {
                            const status = statusInfo(m.status);
                            return (
                                <div
                                    key={m.id}
                                    className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 hover:shadow-xl transition-all"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
                                                {typeIcon(m.type)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900">{m.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {typeLabel(m.type)} • макс. {m.max_score} баллов
                                                </p>
                                                {m.deadline && (
                                                    <p className="text-sm text-gray-500">
                                                        Дедлайн: {new Date(m.deadline).toLocaleString("ru")}
                                                    </p>
                                                )}
                                                {m.max_attempts > 1 && m.type !== "lecture" && (
                                                    <p className="text-sm text-gray-500">
                                                        Попыток: {m.attempts_left} из {m.max_attempts + (m.extra_attempts || 0)}
                                                        {m.extra_attempts > 0 && (
                                                            <span className="text-purple-600 font-medium"> (включая +{m.extra_attempts} от преподавателя)</span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {m.type !== "lecture" ? (
                                                <>
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-sm font-medium`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </div>
                                                    {m.score !== null && (
                                                        <div className="mt-2">
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {m.score} <span className="text-gray-400 text-lg">/ {m.max_score}</span>
                                                            </p>
                                                            {m.type === "test" && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    ✓ Подтверждено преподавателем
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                                                    📖 Лекция
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {m.description && (
                                        <div className="mt-4 p-4 bg-blue-50/80 border border-blue-100 rounded-xl text-sm">
                                            <span className="font-semibold text-blue-800">📋 Задание:</span>{" "}
                                            <span className="text-blue-900 whitespace-pre-wrap">{m.description}</span>
                                        </div>
                                    )}

                                    {m.teacher_comment && (
                                        <div className="mt-4 p-4 bg-amber-50/80 border border-amber-100 rounded-xl text-sm">
                                            <span className="font-semibold text-amber-800">Комментарий преподавателя:</span>{" "}
                                            <span className="text-amber-900">{m.teacher_comment}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2 flex-wrap">
                                        {m.type === "lecture" && (
                                            <>
                                                <button
                                                    onClick={() => downloadMaterial(m.id, m.title)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Скачать лекцию
                                                </button>
                                                <button
                                                    onClick={() => openNotesModal(m.id, m.title)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-medium transition border border-purple-200"
                                                >
                                                    📝 Заметка
                                                </button>
                                            </>
                                        )}

                                        {m.type !== "lecture" && (
                                            <>
                                                <button
                                                    onClick={() => downloadMaterial(m.id, m.title)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Скачать
                                                </button>

                                                <button
                                                    onClick={() => openNotesModal(m.id, m.title)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-medium transition border border-purple-200"
                                                >
                                                    📝 Заметка
                                                </button>

                                                {m.status === "graded" && m.submission_id && (
                                                    hasComplaint[m.submission_id] ? (
                                                        <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-medium">
                                                            🚨 Жалоба подана
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openComplaintModal(m.submission_id!, m.title)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition border border-red-200"
                                                        >
                                                            🚨 Пожаловаться
                                                        </button>
                                                    )
                                                )}

                                                {m.is_final && m.attempts_left === 0 && (
                                                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Работа подтверждена
                                                    </span>
                                                )}

                                                {m.type !== "lecture" && m.attempts_left > 0 && !isClosed(m) && (
                                                    <button
                                                        onClick={() => router.push(m.type === "test" ? `/student/test/${m.id}` : `/student/submit/${m.id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        {m.type === "test" ? (m.submitted ? "Пройти заново" : "Пройти тест") : (m.submitted ? "Пересдать" : "Сдать работу")}
                                                    </button>
                                                )}

                                                {m.attempts_left === 0 && !m.is_final && (
                                                    <span className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200">
                                                        <Clock className="w-4 h-4" />
                                                        Ожидает проверки
                                                    </span>
                                                )}

                                                {isClosed(m) && m.attempts_left > 0 && (
                                                    <span className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-200">
                                                        🔒 Закрыто
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Модалка заметок */}
            {notesModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
                        <button
                            onClick={() => setNotesModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <XCircle className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Заметка</h2>
                        <p className="text-gray-500 text-sm mb-6">{noteMaterialTitle}</p>

                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={12}
                            placeholder="Записывайте важное: формулы, идеи, что повторить..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none font-mono text-sm"
                        />

                        <div className="flex gap-2 pt-4">
                            <button
                                onClick={() => setNotesModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={saveNote}
                                disabled={noteSaving || !noteText.trim()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-purple-500/30"
                            >
                                {noteSaving ? "Сохранение..." : "Сохранить"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка жалобы */}
            {complaintModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
                        <button
                            onClick={() => setComplaintModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <XCircle className="w-5 h-5 text-gray-500" />
                        </button>

                        {complaintSubmitted ? (
                            <div className="text-center py-8">
                                <p className="text-2xl font-bold text-emerald-600 mb-2">✓ Жалоба подана!</p>
                                <p className="text-gray-600">
                                    Преподаватель скоро ответит.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">🚨 Пожаловаться</h2>
                                <p className="text-gray-500 text-sm mb-6">{complaintMaterialTitle}</p>

                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-4">
                                    💡 Жалоба анонимна для других студентов, но преподаватель видит, кто её подал.
                                </div>

                                <textarea
                                    value={complaintText}
                                    onChange={(e) => setComplaintText(e.target.value)}
                                    rows={6}
                                    placeholder="Опишите, почему вы считаете оценку несправедливой..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                                />

                                <div className="flex gap-2 pt-4">
                                    <button
                                        onClick={() => setComplaintModalOpen(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={submitComplaint}
                                        disabled={complaintSaving || !complaintText.trim()}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-red-500/30"
                                    >
                                        {complaintSaving ? "Отправка..." : "Подать жалобу"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}