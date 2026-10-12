"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Upload, FileText, FlaskConical, BookOpen, ClipboardList, CheckCircle2, Clock, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface Material {
    id: number;
    title: string;
    type: string;
    max_score: number;
    opens_at: string;
    deadline: string | null;
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

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
    }, [groupId, router, token]);

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
                        Назад к дисциплинам
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Материалы дисциплины</h1>
                    <p className="text-gray-600 mt-1">{materials.length} материалов</p>
                </div>

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
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-sm font-medium`}>
                                                {status.icon}
                                                {status.label}
                                            </div>
                                            {m.score !== null && (
                                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                                    {m.score} <span className="text-gray-400 text-lg">/ {m.max_score}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {m.teacher_comment && (
                                        <div className="mt-4 p-4 bg-amber-50/80 border border-amber-100 rounded-xl text-sm">
                                            <span className="font-semibold text-amber-800">Комментарий преподавателя:</span>{" "}
                                            <span className="text-amber-900">{m.teacher_comment}</span>
                                        </div>
                                    )}

                                    <div className="mt-4 flex gap-2">
                                        <a
                                            href={`http://localhost:8000/materials/${m.id}/download`}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                                        >
                                            <Download className="w-4 h-4" />
                                            Скачать
                                        </a>

                                        {!m.submitted && m.type !== "lecture" && (
                                            <button
                                                onClick={() => router.push(`/student/submit/${m.id}`)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Сдать работу
                                            </button>
                                        )}
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