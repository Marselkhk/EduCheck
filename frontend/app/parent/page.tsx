"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserPlus, Eye, CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import Logo from "@/components/Logo";

interface Child {
    id: number;
    full_name: string;
    email: string;
}

export default function ParentDashboard() {
    const router = useRouter();
    const [children, setChildren] = useState<Child[]>([]);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [studentEmail, setStudentEmail] = useState("");
    const [linking, setLinking] = useState(false);
    const [linkError, setLinkError] = useState("");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        const role = localStorage.getItem("role");
        if (!token || role !== "parent") {
            router.push("/login");
            return;
        }
        setFullName(localStorage.getItem("full_name") || "");
        loadChildren();
    }, [router, token]);

    const loadChildren = () => {
        fetch("http://localhost:8000/parents/my-children", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setChildren(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const linkStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinkError("");
        setLinking(true);

        const res = await fetch("http://localhost:8000/parents/link", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ student_email: studentEmail }),
        });

        const data = await res.json();
        setLinking(false);

        if (res.ok) {
            setShowLinkModal(false);
            setStudentEmail("");
            loadChildren();
        } else {
            setLinkError(data.detail || "Ошибка");
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
            <div className="max-w-4xl mx-auto">
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
                    <p className="text-gray-600 text-lg">Следите за успеваемостью ребёнка</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Мои дети</h2>
                    <button
                        onClick={() => setShowLinkModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/30 text-sm font-medium"
                    >
                        <UserPlus className="w-4 h-4" />
                        Привязать ребёнка
                    </button>
                </div>

                {children.length === 0 ? (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 text-3xl">
                            👨‍👩‍👧
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Нет привязанных детей
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Привяжите ребёнка по email, который он использовал при регистрации
                        </p>
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg shadow-indigo-500/30 font-medium"
                        >
                            <UserPlus className="w-5 h-5" />
                            Привязать ребёнка
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 hover:shadow-2xl transition cursor-pointer"
                                onClick={() => router.push(`/parent/child/${child.id}`)}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                        {child.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{child.full_name}</h3>
                                        <p className="text-sm text-gray-500">{child.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                                    <Eye className="w-4 h-4" />
                                    Посмотреть успеваемость
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модалка привязки */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowLinkModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Привязать ребёнка</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Введите email, который ребёнок использовал при регистрации
                        </p>

                        <form onSubmit={linkStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Email студента</label>
                                <input
                                    type="email"
                                    value={studentEmail}
                                    onChange={(e) => setStudentEmail(e.target.value)}
                                    required
                                    placeholder="student@example.com"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {linkError && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                                    {linkError}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLinkModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={linking}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-indigo-500/30"
                                >
                                    {linking ? "Привязка..." : "Привязать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}