"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Ошибка входа");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            localStorage.setItem("full_name", data.full_name);

            if (data.role === "teacher") {
                router.push("/teacher");
            } else if (data.role === "parent") {
                router.push("/parent");
            } else if (data.role === "curator") {
                router.push("/curator");
            } else {
                router.push("/student");
            }
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
                    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-emerald-500/20 border border-white/80 p-8 relative overflow-hidden">
                        {/* Декоративные пятна */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />

                        <div className="relative">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Вход</h1>
                                <p className="text-gray-500 mt-2">Войдите в свой аккаунт</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            placeholder="teacher@test.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Пароль
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            placeholder="••••••"
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
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        "Вход..."
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            Войти
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-4">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-gray-500 hover:text-emerald-600 transition"
                                >
                                    Забыли пароль?
                                </Link>
                            </div>

                            <p className="text-center mt-4 text-sm text-gray-600">
                                Нет аккаунта?{" "}
                                <Link href="/register" className="text-emerald-600 hover:underline font-semibold">
                                    Зарегистрироваться
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}