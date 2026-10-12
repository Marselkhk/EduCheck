"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";

interface Notification {
    id: number;
    title: string;
    message: string | null;
    type: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const loadNotifications = () => {
        if (!token) return;

        fetch("http://localhost:8000/notifications/my", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setNotifications(Array.isArray(data) ? data : []);
            })
            .catch(() => { });

        fetch("http://localhost:8000/notifications/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setUnreadCount(data.count || 0))
            .catch(() => { });
    };

    useEffect(() => {
        loadNotifications();
        // Обновляем каждые 30 секунд
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        if (!token) return;
        await fetch(`http://localhost:8000/notifications/${id}/read`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        loadNotifications();
    };

    const markAllRead = async () => {
        if (!token) return;
        await fetch("http://localhost:8000/notifications/read-all", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        loadNotifications();
    };

    const handleClick = (n: Notification) => {
        markAsRead(n.id);
        if (n.link) {
            router.push(n.link);
            setIsOpen(false);
        }
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case "grade": return "📝";
            case "deadline": return "⏰";
            case "material": return "📚";
            default: return "🔔";
        }
    };

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return "только что";
        if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
        return date.toLocaleDateString("ru");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition"
            >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Уведомления</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <CheckCheck className="w-3 h-3" />
                                Прочитать все
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            Уведомлений пока нет
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition ${!n.is_read ? "bg-blue-50/50" : ""
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="text-lg flex-shrink-0">{typeIcon(n.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {n.title}
                                                </p>
                                                {!n.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                                )}
                                            </div>
                                            {n.message && (
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {n.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {timeAgo(n.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}