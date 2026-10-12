"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, AlertCircle, PenLine } from "lucide-react";
import Logo from "@/components/Logo";

interface Material {
    id: number;
    title: string;
    type: string;
    description: string | null;
    max_score: number;
    max_attempts: number;
    opens_at: string;
    deadline: string | null;
}

interface AttemptsInfo {
    max_attempts: number;
    used: number;
    left: number;
    can_submit: boolean;
}

export default function SubmitPage() {
    const params = useParams();
    const router = useRouter();
    const materialId = params.id as string;

    const [material, setMaterial] = useState<Material | null>(null);
    const [attempts, setAttempts] = useState<AttemptsInfo | null>(null);
    const [mode, setMode] = useState<"file" | "text">("file");
    const [file, setFile] = useState<File | null>(null);
    const [textAnswer, setTextAnswer] = useState("");
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        Promise.all([
            fetch(`http://localhost:8000/materials/${materialId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch(`http://localhost:8000/materials/${materialId}/attempts`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
        ])
            .then(([materialData, attemptsData]) => {
                setMaterial(materialData);
                setAttempts(attemptsData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [materialId, router, token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (mode === "file" && !file) {
            setError("Выберите файл");
            return;
        }

        if (mode === "text" && !textAnswer.trim()) {
            setError("Напишите ответ");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append("material_id", materialId);
        if (comment) formData.append("comment", comment);
        if (mode === "file" && file) formData.append("file", file);
        if (mode === "text") formData.append("text_answer", textAnswer);

        const res = await fetch("http://localhost:8000/submissions/", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            setSuccess(true);
            setTimeout(() => router.push("/student"), 1500);
        } else {
            const data = await res.json();
            setError(data.detail || "Ошибка отправки");
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    if (!material) {
        return (
            <main className="flex min-h-screen items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-xl text-gray-900 font-bold mb-4">Материал не найден</p>
                    <button
                        onClick={() => router.push("/student")}
                        className="text-blue-600 hover:underline"
                    >
                        ← Назад к дисциплинам
                    </button>
                </div>
            </main>
        );
    }

    if (success) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">✓ Работа отправлена!</p>
                    <p className="text-gray-600 mt-2">Перенаправление...</p>
                </div>
            </main>
        );
    }

    const canSubmit = attempts?.can_submit ?? true;

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
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

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-white/80 p-8 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
                                <p className="text-sm text-gray-500">
                                    Макс. баллов: {material.max_score}
                                    {material.deadline && (
                                        <> • Дедлайн: {new Date(material.deadline).toLocaleString("ru")}</>
                                    )}
                                </p>
                            </div>
                        </div>

                        {material.description && (
                            <div className="mb-6 p-4 bg-blue-50/80 border border-blue-100 rounded-xl">
                                <p className="text-sm font-medium text-blue-900 mb-2">📋 Задание:</p>
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">{material.description}</p>
                            </div>
                        )}

                        {attempts && (
                            <div className={`mb-6 p-4 rounded-xl border ${canSubmit
                                    ? "bg-emerald-50/80 border-emerald-100"
                                    : "bg-red-50/80 border-red-100"
                                }`}>
                                <div className="flex items-center gap-2">
                                    {canSubmit ? (
                                        <>
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                            <p className="text-sm text-emerald-900">
                                                <strong>Попыток осталось: {attempts.left}</strong> из {attempts.max_attempts}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <p className="text-sm text-red-900">
                                                <strong>Попытки закончились.</strong> Использовано {attempts.used} из {attempts.max_attempts}.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {canSubmit ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setMode("file")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition font-medium text-sm ${mode === "file"
                                                ? "bg-white shadow text-blue-600"
                                                : "text-gray-600 hover:text-gray-900"
                                            }`}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Загрузить файл
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode("text")}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition font-medium text-sm ${mode === "text"
                                                ? "bg-white shadow text-blue-600"
                                                : "text-gray-600 hover:text-gray-900"
                                            }`}
                                    >
                                        <PenLine className="w-4 h-4" />
                                        Написать ответ
                                    </button>
                                </div>

                                {mode === "file" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            Файл с работой *
                                        </label>
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 transition"
                                        />
                                    </div>
                                )}

                                {mode === "text" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            Ответ *
                                        </label>
                                        <textarea
                                            value={textAnswer}
                                            onChange={(e) => setTextAnswer(e.target.value)}
                                            rows={10}
                                            placeholder="Напишите ответ здесь..."
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono text-sm"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Комментарий (необязательно)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={2}
                                        placeholder="Комментарий для преподавателя"
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm bg-red-50/80 backdrop-blur p-3 rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        "Отправка..."
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5" />
                                            Отправить работу
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">
                                    Вы использовали все попытки. Обратитесь к преподавателю.
                                </p>
                                <button
                                    onClick={() => router.push("/student")}
                                    className="text-blue-600 hover:underline"
                                >
                                    ← Назад к дисциплинам
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}