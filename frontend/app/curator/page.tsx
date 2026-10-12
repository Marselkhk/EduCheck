"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";
import Logo from "@/components/Logo";

interface GroupInfo {
    group_id: number;
    group_name: string;
    course_id: number;
    course_title: string;
    course_code: string;
    students_count: number;
}

export default function CuratorDashboard() {
    const router = useRouter();
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (!token || role !== "curator") {
            router.push("/login");
            return;
        }

        setFullName(localStorage.getItem("full_name") || "");

        fetch("http://localhost:8000/curators/my-groups", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setGroups(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

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
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <Logo />
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Выйти
                    </button>
                </header>

                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Здравствуйте, {fullName}!
                    </h1>
                    <p className="text-gray-600 text-lg">Группы, за которыми вы следите</p>
                </div>

                {groups.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Нет привязанных групп
                        </h3>
                        <p className="text-gray-600">
                            Преподаватель привяжет вас к группе по email
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {groups.map((g) => (
                            <div
                                key={g.group_id}
                                onClick={() => router.push(`/curator/group/${g.group_id}`)}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 hover:shadow-2xl hover:shadow-cyan-500/20 transition cursor-pointer"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{g.group_name}</h3>
                                        <p className="text-sm text-gray-500">{g.course_title}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                        Студентов: <strong>{g.students_count}</strong>
                                    </span>
                                    <span className="font-mono text-cyan-600 font-semibold">
                                        {g.course_code}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}