"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Eye, Copy, Check } from "lucide-react";
import Logo from "@/components/Logo";

interface Contacts {
    telegram?: string;
    github?: string;
    email?: string;
    phone?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [bio, setBio] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [newSkill, setNewSkill] = useState("");
    const [contacts, setContacts] = useState<Contacts>({});
    const [isPublic, setIsPublic] = useState(false);
    const [showCourses, setShowCourses] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [myId, setMyId] = useState<number | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }

        fetch("http://localhost:8000/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((user) => {
                setMyId(user.id);
                return fetch("http://localhost:8000/profiles/my", {
                    headers: { Authorization: `Bearer ${token}` },
                });
            })
            .then((res) => res.json())
            .then((data) => {
                setBio(data.bio || "");
                setSkills(data.skills || []);
                setContacts(data.contacts || {});
                setIsPublic(data.is_public || false);
                setShowCourses(data.show_courses !== false);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [router, token]);

    const addSkill = () => {
        if (!newSkill.trim()) return;
        if (skills.includes(newSkill.trim())) return;
        setSkills([...skills, newSkill.trim()]);
        setNewSkill("");
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter((s) => s !== skill));
    };

    const saveProfile = async () => {
        setSaving(true);
        const res = await fetch("http://localhost:8000/profiles/my", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                bio,
                skills,
                contacts,
                is_public: isPublic,
                show_courses: showCourses,
            }),
        });
        setSaving(false);

        if (res.ok) {
            alert("Профиль сохранён!");
        } else {
            alert("Ошибка сохранения");
        }
    };

    const copyLink = () => {
        if (!myId) return;
        const link = `${window.location.origin}/u/${myId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
            <div className="max-w-3xl mx-auto">
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
                    <h1 className="text-3xl font-bold text-gray-900">Моё портфолио</h1>
                    <p className="text-gray-600 mt-1">Публичный профиль для резюме и компаний</p>
                </div>

                {/* Публикация */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Публичность</h2>
                            <p className="text-sm text-gray-500">Разрешить другим видеть профиль</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    {isPublic && myId && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                            <span className="text-sm text-emerald-800 truncate flex-1">
                                {window.location.origin}/u/{myId}
                            </span>
                            <button
                                onClick={copyLink}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Скопировано" : "Копировать"}
                            </button>
                        </div>
                    )}
                </div>

                {/* О себе */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">О себе</h2>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder="Расскажите о себе: чем занимаетесь, что интересно, какие цели..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Навыки */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Навыки</h2>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                            placeholder="Python, React, SQL..."
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addSkill}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span
                                key={skill}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                                {skill}
                                <button onClick={() => removeSkill(skill)} className="hover:text-red-600">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Контакты */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Контакты</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Telegram</label>
                            <input
                                type="text"
                                value={contacts.telegram || ""}
                                onChange={(e) => setContacts({ ...contacts, telegram: e.target.value })}
                                placeholder="@username"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">GitHub</label>
                            <input
                                type="text"
                                value={contacts.github || ""}
                                onChange={(e) => setContacts({ ...contacts, github: e.target.value })}
                                placeholder="github.com/username"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                            <input
                                type="email"
                                value={contacts.email || ""}
                                onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Показывать курсы */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showCourses}
                            onChange={(e) => setShowCourses(e.target.checked)}
                            className="w-5 h-5 rounded accent-blue-600"
                        />
                        <div>
                            <p className="font-medium text-gray-900">Показывать мои курсы и оценки</p>
                            <p className="text-sm text-gray-500">Компании увидят ваши проекты и успеваемость</p>
                        </div>
                    </label>
                </div>

                {/* Сохранить */}
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 transition font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    {saving ? "Сохранение..." : "Сохранить профиль"}
                </button>

                {/* Просмотр */}
                {isPublic && myId && (
                    <button
                        onClick={() => router.push(`/u/${myId}`)}
                        className="w-full mt-3 bg-white/70 backdrop-blur border border-gray-200 text-gray-700 py-3.5 rounded-2xl hover:bg-white transition font-medium flex items-center justify-center gap-2"
                    >
                        <Eye className="w-5 h-5" />
                        Посмотреть как видят другие
                    </button>
                )}
            </div>
        </main>
    );
}