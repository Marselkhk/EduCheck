"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, UserPlus } from "lucide-react";
import Logo from "@/components/Logo";

export default function ParentRegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/auth/register/parent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, full_name: fullName }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Ошибка регистрации");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("full_name", data.full_name);

            router.push("/parent");
        } catch (err) {
            setError("Ошибка соединения с сервером");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen">
            <header className="absolute top-6 left-6 z-20">
                <Logo />
            </header>

            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-500/20 border border-white/80 p-8 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                                    <UserPlus className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">Регистрация</h1>
                                <p className="text-gray-500 mt-2">Для родителей</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">ФИО *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Иванов Иван Иванович"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Email *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="parent@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Пароль *</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="минимум 6 символов"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm bg-red-50/80 backdrop-blur p-3 rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-semibold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                                >
                                    {loading ? "Регистрация..." : "Зарегистрироваться"}
                                </button>
                            </form>

                            <p className="text-center mt-6 text-sm text-gray-600">
                                Уже есть аккаунт?{" "}
                                <a href="/login" className="text-indigo-600 hover:underline font-semibold">
                                    Войти
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}