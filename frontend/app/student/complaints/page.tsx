"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import Logo from "@/components/Logo";

interface Complaint {
    id: number;
    text: string;
    status: string;
    teacher_response: string | null;
    material_title: string;
    created_at: string;
    resolved_at: string | null;
}

export default function StudentComplaintsPage() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:8000/complaints/my", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setComplaints(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    const statusBadge = (status: string) => {
        switch (status) {
            case "open":
                return { label: "На рассмотрении", color: "text-amber-700", bg: "bg-amber-50", icon: <AlertCircle className="w-4 h-4" /> };
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
                        onClick={() => router.push("/student")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Мои жалобы</h1>
                    <p className="text-gray-600 mt-1">
                        {complaints.filter((c) => c.status === "open").length} открытых из {complaints.length}
                    </p>
                </div>

                {complaints.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Жалоб пока нет
                        </h3>
                        <p className="text-gray-600">
                            Если вы не согласны с оценкой — можете подать жалобу на странице дисциплины.
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
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${badge.bg} ${badge.color}`}>
                                            {badge.icon}
                                            {badge.label}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Работа: {c.material_title}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Ваша жалоба:</p>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</p>
                                    </div>

                                    {c.teacher_response && (
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-xs font-medium text-blue-600 mb-1">Ответ преподавателя:</p>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.teacher_response}</p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-2">
                                        Подана: {new Date(c.created_at).toLocaleString("ru")}
                                        {c.resolved_at && ` • Решена: ${new Date(c.resolved_at).toLocaleString("ru")}`}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}