"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, MessageCircle, MessagesSquare, Trash2 } from "lucide-react";
import Logo from "@/components/Logo";

interface Message {
    id: number;
    group_id: number;
    user_id: number;
    user_name: string;
    user_role: string;
    parent_id: number | null;
    text: string;
    is_forum: boolean;
    created_at: string;
}

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const [mode, setMode] = useState<"chat" | "forum">("chat");
    const [loading, setLoading] = useState(true);
    const [myUserId, setMyUserId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            .then((data) => setMyUserId(data.id))
            .catch(() => { });
    }, [token, router]);

    const loadMessages = () => {
        if (!token) return;
        fetch(`http://localhost:8000/messages/${groupId}?is_forum=${mode === "forum"}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setMessages(Array.isArray(data) ? data : []);
                setLoading(false);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        setLoading(true);
        loadMessages();
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [mode, groupId, token]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !token) return;

        const res = await fetch("http://localhost:8000/messages/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                group_id: Number(groupId),
                text,
                is_forum: mode === "forum",
            }),
        });

        if (res.ok) {
            setText("");
            loadMessages();
        }
    };

    const deleteMessage = async (id: number) => {
        if (!confirm("Удалить сообщение?")) return;
        const res = await fetch(`http://localhost:8000/messages/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) loadMessages();
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleString("ru", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <button
                        onClick={() => router.push(`/student/discipline/${groupId}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад
                    </button>
                </header>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setMode("chat")}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition ${mode === "chat"
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <MessageCircle className="w-5 h-5" />
                            Чат
                        </button>
                        <button
                            onClick={() => setMode("forum")}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition ${mode === "forum"
                                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/30"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <MessagesSquare className="w-5 h-5" />
                            Форум
                        </button>
                    </div>

                    <div className="p-4 h-[500px] overflow-y-auto space-y-3 bg-gray-50/30">
                        {loading ? (
                            <div className="text-center text-gray-500 py-8">Загрузка...</div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                {mode === "chat" ? "Сообщений пока нет" : "Тем пока нет"}
                            </div>
                        ) : (
                            messages.map((m) => {
                                const isMine = m.user_id === myUserId;
                                const isTeacher = m.user_role === "teacher";

                                return (
                                    <div
                                        key={m.id}
                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMine
                                                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                                    : isTeacher
                                                        ? "bg-amber-50 border border-amber-200 text-gray-900"
                                                        : "bg-white border border-gray-200 text-gray-900"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-medium ${isMine ? "text-blue-100" : isTeacher ? "text-amber-700" : "text-gray-500"}`}>
                                                    {m.user_name}
                                                </span>
                                                {isTeacher && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-medium">
                                                        Препод
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {m.text}
                                            </p>
                                            <div className={`flex items-center justify-between mt-1 gap-2 ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                                                <span className="text-xs">{formatTime(m.created_at)}</span>
                                                {(isMine || isTeacher) && (
                                                    <button
                                                        onClick={() => deleteMessage(m.id)}
                                                        className="opacity-50 hover:opacity-100 transition"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={mode === "chat" ? "Написать сообщение..." : "Создать тему..."}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 transition shadow-lg shadow-blue-500/30"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}