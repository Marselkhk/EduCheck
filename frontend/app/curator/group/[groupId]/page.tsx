"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Logo from "@/components/Logo";

interface Student {
    user_id: number;
    full_name: string;
    email: string;
    total_score: number;
    max_possible: number;
    percentage: number;
    status: string;
    attendance_percentage: number;
}

interface GroupOverview {
    group_id: number;
    group_name: string;
    course_title: string;
    auto_threshold: number;
    admission_threshold: number;
    students: Student[];
}

export default function CuratorGroupPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [data, setData] = useState<GroupOverview | null>(null);
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch(`http://localhost:8000/curators/group/${groupId}/overview`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [groupId, router, token]);

    const statusLabel = (status: string) => {
        switch (status) {
            case "automatic": return { label: "Автомат", color: "text-emerald-600", bg: "bg-emerald-50" };
            case "admitted": return { label: "Допуск", color: "text-amber-600", bg: "bg-amber-50" };
            case "not_admitted": return { label: "Недопуск", color: "text-red-600", bg: "bg-red-50" };
            default: return { label: "—", color: "text-gray-500", bg: "bg-gray-100" };
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    if (!data) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Нет данных</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push("/curator")}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{data.group_name}</h1>
                    <p className="text-gray-600 mt-1">{data.course_title}</p>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Студенты ({data.students.length})
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {data.students.map((s) => {
                            const status = statusLabel(s.status);
                            return (
                                <div
                                    key={s.user_id}
                                    className="flex items-center justify-between p-4 bg-white/60 rounded-xl hover:bg-white transition"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {s.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{s.full_name}</p>
                                            <p className="text-xs text-gray-500">{s.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Посещаемость</p>
                                            <p className="font-bold text-gray-900">{s.attendance_percentage}%</p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Успеваемость</p>
                                            <p className="font-bold text-gray-900">{s.percentage}%</p>
                                        </div>

                                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${status.bg} ${status.color} min-w-[90px] text-center`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}