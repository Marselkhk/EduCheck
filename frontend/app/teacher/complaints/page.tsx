"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import Logo from "@/components/Logo";

interface Complaint {
    id: number;
    student_name: string;
    student_email: string;
    text: string;
    status: string;
    teacher_response: string | null;
    material_title: string;
    submission_score: number | null;
    submission_max: number | null;
    created_at: string;
    resolved_at: string | null;
}

export default function TeacherComplaintsPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [respondingId, setRespondingId] = useState<number | null>(null);
    const [responseText, setResponseText] = useState("");
    const [responseStatus, setResponseStatus] = useState<"resolved" | "rejected">("resolved");

    const [grantExtraAttempt, setGrantExtraAttempt] = useState(false);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const loadComplaints = () => {
        if (!token) return;
        fetch("http://localhost:8000/complaints/teacher", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setComplaints(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }
        loadComplaints();
    }, [router, token]);

    const openRespondModal = (id: number) => {
        setRespondingId(id);
        setResponseText("");
        setResponseStatus("resolved");
        setGrantExtraAttempt(false);
        setRespondModalOpen(true);
    };

    const submitResponse = async () => {
        if (!respondingId || !responseText.trim()) return;

        const res = await fetch(`http://localhost:8000/complaints/${respondingId}/respond`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                teacher_response: responseText,
                status: responseStatus,
                grant_extra_attempt: grantExtraAttempt,
            }),
        });

        if (res.ok) {
            setRespondModalOpen(false);
            setRespondingId(null);
            loadComplaints();
        } else {
            alert("Ошибка");
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "open":
                return { label: "Открыта", color: "text-amber-700", bg: "bg-amber-50", icon: <AlertCircle className="w-4 h-4" /> };
            case "resolved":
                return { label: "Решена", color: "text-emerald-700", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4" /> };
            case "rejected":
                return { label: "Отклонена", color: "text-red-700", bg: "bg-red-50", icon: <XCircle className="w-4 h-4" /> };
            default:
                return { label: status, color: "text-gray-700", bg: "bg-gray-50", icon: null };
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
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Жалобы студентов</h1>
                    <p className="text-gray-600 mt-1">
                        {complaints.filter((c) => c.status === "open").length} открытых из {complaints.length}
                    </p>
                </div>

                {complaints.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Жалоб пока нет
                        </h3>
                        <p className="text-gray-600">
                            Если студент будет не согласен с оценкой — жалоба появится здесь.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {complaints.map((c) => {
                            const badge = statusBadge(c.status);
                            return (
                                <div
                                    key={c.id}
                                    className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-5"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="font-medium text-gray-900">{c.student_name}</span>
                                                <span className="text-xs text-gray-500">{c.student_email}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${badge.bg} ${badge.color}`}>
                                                    {badge.icon}
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Работа: <strong>{c.material_title}</strong>
                                                {c.submission_score !== null && c.submission_max !== null && (
                                                    <> • Оценка: {c.submission_score}/{c.submission_max}</>
                                                )}
                                            </p>
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Жалоба:</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</p>
                                            </div>
                                            {c.teacher_response && (
                                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <p className="text-xs font-medium text-blue-600 mb-1">Ваш ответ:</p>
                                                    <p className="text-sm text-gray-800">{c.teacher_response}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(c.created_at).toLocaleString("ru")}
                                            </p>
                                        </div>

                                        {c.status === "open" && (
                                            <button
                                                onClick={() => openRespondModal(c.id)}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 text-sm font-medium whitespace-nowrap"
                                            >
                                                Ответить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {respondModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Ответ на жалобу</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Решение</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setResponseStatus("resolved")}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${responseStatus === "resolved"
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        ✓ Решена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setResponseStatus("rejected")}
                                        className={`flex-1 px-4 py-3 rounded-xl font-medium transition ${responseStatus === "rejected"
                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        ✗ Отклонить
                                    </button>
                                </div>
                            </div>

                            {responseStatus === "resolved" && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={grantExtraAttempt}
                                            onChange={(e) => setGrantExtraAttempt(e.target.checked)}
                                            className="w-5 h-5 rounded accent-blue-600"
                                        />
                                        <div>
                                            <p className="font-medium text-blue-900">Дать дополнительную попытку</p>
                                            <p className="text-xs text-blue-700">Студент сможет пересдать работу</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Ответ</label>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={5}
                                    placeholder="Объясните решение..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setRespondModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={submitResponse}
                                    disabled={!responseText.trim()}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-blue-500/30"
                                >
                                    Отправить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}