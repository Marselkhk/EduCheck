"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Users, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function RegisterChoicePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen">
            <header className="absolute top-6 left-6 z-20">
                <Logo />
            </header>

            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">Регистрация</h1>
                        <p className="text-gray-600 text-lg">Выберите, кем вы хотите зарегистрироваться</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Преподаватель */}
                        <button
                            onClick={() => router.push("/register/teacher")}
                            className="group bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-emerald-500/20 border border-white/80 p-8 hover:shadow-emerald-500/40 hover:border-emerald-200 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Преподаватель
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    Создавайте курсы, группы и материалы. Проверяйте работы студентов.
                                </p>
                                <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                                    <span>Продолжить</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>

                        {/* Студент */}
                        <button
                            onClick={() => router.push("/register/student")}
                            className="group bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-500/20 border border-white/80 p-8 hover:shadow-blue-500/40 hover:border-blue-200 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Студент
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    Присоединяйтесь к курсам, сдавайте работы и следите за оценками.
                                </p>
                                <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                                    <span>Продолжить</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>

                        {/* Родитель */}
                        <button
                            onClick={() => router.push("/register/parent")}
                            className="group bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-500/20 border border-white/80 p-8 hover:shadow-indigo-500/40 hover:border-indigo-200 transition-all duration-300 text-left relative overflow-hidden"
                        >
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">
                                    Родитель
                                </h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    Следите за успеваемостью ребёнка и его оценками.
                                </p>
                                <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                                    <span>Продолжить</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    </div>
                    {/* Куратор */}
                    <button
                        onClick={() => router.push("/register/curator")}
                        className="group bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-cyan-500/20 border border-white/80 p-8 hover:shadow-cyan-500/40 hover:border-cyan-200 transition-all duration-300 text-left relative overflow-hidden"
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                Куратор
                            </h2>
                            <p className="text-gray-600 text-sm mb-4">
                                Следите за успеваемостью группы, помогайте отстающим.
                            </p>
                            <div className="flex items-center gap-2 text-cyan-600 font-medium text-sm">
                                <span>Продолжить</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>

                    <p className="text-center mt-8 text-sm text-gray-600">
                        Уже есть аккаунт?{" "}
                        <a href="/login" className="text-emerald-600 hover:underline font-semibold">
                            Войти
                        </a>
                    </p>
                </div>
            </div>
        </main>
    );
}