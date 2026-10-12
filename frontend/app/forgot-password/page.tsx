"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main className="min-h-screen">
            <header className="absolute top-6 left-6 z-20">
                <Logo />
            </header>

            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-emerald-500/20 border border-white/80 p-8 relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />

                        <div className="relative">
                            {!submitted ? (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                            <Mail className="w-7 h-7 text-white" />
                                        </div>
                                        <h1 className="text-3xl font-bold text-gray-900">Забыли пароль?</h1>
                                        <p className="text-gray-500 mt-2">
                                            Введите email — мы отправим ссылку для восстановления
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="w-full pl-12 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                                    placeholder="teacher@test.com"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                                        >
                                            Отправить ссылку
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                            <CheckCircle2 className="w-7 h-7 text-white" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-gray-900">Функция в разработке</h1>
                                        <p className="text-gray-600 mt-3">
                                            Восстановление пароля через email появится в ближайшее время.
                                        </p>
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                                            💡 Пока для сброса пароля обратитесь на почту
                                            EduCheck@gmail.com
                    
                                        </div>
                                    </div>

                                    <Link
                                        href="/login"
                                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl text-gray-700 font-medium transition"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Вернуться ко входу
                                    </Link>
                                </>
                            )}

                            {!submitted && (
                                <div className="text-center mt-6">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Назад ко входу
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}