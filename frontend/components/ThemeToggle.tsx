"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("theme") as "light" | "dark" | null;
        if (saved) {
            setTheme(saved);
            document.documentElement.classList.toggle("dark", saved === "dark");
        } else {
            // Системная тема
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setTheme(prefersDark ? "dark" : "light");
            document.documentElement.classList.toggle("dark", prefersDark);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition shadow-lg"
            title={theme === "light" ? "Тёмная тема" : "Светлая тема"}
        >
            {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-700" />
            ) : (
                <Sun className="w-5 h-5 text-amber-400" />
            )}
        </button>
    );
}