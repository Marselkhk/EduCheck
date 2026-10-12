"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Mail, Send, Award, BookOpen, Code2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Project {
    title: string;
    type: string;
    score: number;
    max_score: number;
}

interface CourseData {
    course_title: string;
    course_code: string;
    group_name: string;
    total_score: number;
    max_possible: number;
    percentage: number;
    projects: Project[];
}

interface Profile {
    user_id: number;
    full_name: string;
    email: string;
    bio: string;
    skills: string[];
    contacts: {
        telegram?: string;
        github?: string;
        email?: string;
        phone?: string;
    };
    courses: CourseData[];
}

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://localhost:8000/profiles/public/${userId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Профиль не найден или не публичный");
                return res.json();
            })
            .then((data) => {
                setProfile(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [userId]);

    const typeLabel = (type: string) => {
        switch (type) {
            case "lab": return "🧪 Лабораторная";
            case "hw": return "📝 Домашнее задание";
            case "test": return "✅ Тест";
            default: return type;
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    if (error || !profile) {
        return (
            <main className="min-h-screen p-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Профиль недоступен</h1>
                    <p className="text-gray-600">{error || "Профиль не публичный"}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <Logo />
                </header>

                {/* Шапка профиля */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl p-8 mb-6 text-white relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-5xl font-bold shadow-xl">
                            {profile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{profile.full_name}</h1>
                            <p className="text-blue-100">{profile.email}</p>
                            {profile.bio && (
                                <p className="text-blue-50 mt-3 whitespace-pre-wrap">{profile.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Контакты */}
                    <div className="relative flex flex-wrap gap-2 mt-6">
                        {profile.contacts?.telegram && (
                            <a
                                href={`https://t.me/${profile.contacts.telegram.replace("@", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition text-sm font-medium"
                            >
                                <Send className="w-4 h-4" />
                                {profile.contacts.telegram}
                            </a>
                        )}
                        {profile.contacts?.github && (
                            <a
                                href={`https://${profile.contacts.github.replace("https://", "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition text-sm font-medium"
                            >
                                <Code2 className="w-4 h-4" />
                                GitHub
                            </a>
                        )}
                        {profile.contacts?.email && (
                            <a
                                href={`mailto:${profile.contacts.email}`}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition text-sm font-medium"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </a>
                        )}
                    </div>
                </div>

                {/* Навыки */}
                {profile.skills.length > 0 && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            Навыки
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill) => (
                                <span
                                    key={skill}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Курсы */}
                {profile.courses.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            Проекты и курсы
                        </h2>

                        {profile.courses.map((course, i) => (
                            <div
                                key={i}
                                className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6"
                            >
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{course.course_title}</h3>
                                        <p className="text-sm text-gray-500">
                                            {course.group_name} • код: <span className="font-mono">{course.course_code}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                            {course.percentage}%
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {course.total_score} / {course.max_possible}
                                        </p>
                                    </div>
                                </div>

                                {/* Прогресс */}
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                        style={{ width: `${Math.min(course.percentage, 100)}%` }}
                                    />
                                </div>

                                {/* Проекты */}
                                {course.projects.length > 0 && (
                                    <div className="space-y-2">
                                        {course.projects.map((p, j) => (
                                            <div
                                                key={j}
                                                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm">{typeLabel(p.type)}</span>
                                                    <span className="text-sm font-medium text-gray-900">{p.title}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${p.score >= p.max_score * 0.8
                                                    ? "text-emerald-600"
                                                    : p.score >= p.max_score * 0.5
                                                        ? "text-amber-600"
                                                        : "text-red-600"
                                                    }`}>
                                                    {p.score} / {p.max_score}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}