"use client";

import { BookOpen, GraduationCap, Calculator, FileText, Award, Lightbulb, PenTool, FlaskConical, Brain, Target, Rocket, Puzzle } from "lucide-react";

export default function Background() {
    const items = [
        { Icon: BookOpen, top: "8%", left: "4%", size: 140, rotate: -15, color: "#10b981", opacity: 0.15 },
        { Icon: GraduationCap, top: "15%", left: "78%", size: 120, rotate: 20, color: "#3b82f6", opacity: 0.12 },
        { Icon: Calculator, top: "55%", left: "8%", size: 100, rotate: 10, color: "#f59e0b", opacity: 0.13 },
        { Icon: FileText, top: "72%", left: "82%", size: 110, rotate: -25, color: "#8b5cf6", opacity: 0.12 },
        { Icon: Award, top: "38%", left: "42%", size: 130, rotate: 15, color: "#ec4899", opacity: 0.08 },
        { Icon: Lightbulb, top: "82%", left: "48%", size: 90, rotate: -10, color: "#eab308", opacity: 0.15 },
        { Icon: PenTool, top: "3%", left: "48%", size: 105, rotate: 30, color: "#06b6d4", opacity: 0.12 },
        { Icon: FlaskConical, top: "48%", left: "28%", size: 115, rotate: -20, color: "#14b8a6", opacity: 0.1 },
        { Icon: Brain, top: "25%", left: "25%", size: 95, rotate: 12, color: "#a855f7", opacity: 0.1 },
        { Icon: Target, top: "65%", left: "65%", size: 85, rotate: -18, color: "#ef4444", opacity: 0.1 },
        { Icon: Rocket, top: "5%", left: "25%", size: 90, rotate: 25, color: "#f97316", opacity: 0.12 },
        { Icon: Puzzle, top: "88%", left: "15%", size: 100, rotate: -22, color: "#6366f1", opacity: 0.1 },
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Базовый градиент — светлая тема */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

            {/* Иконки */}
            {items.map((item, i) => {
                const IconComponent = item.Icon;
                return (
                    <div
                        key={i}
                        className="absolute"
                        style={{
                            top: item.top,
                            left: item.left,
                            color: item.color,
                            opacity: item.opacity,
                            transform: `rotate(${item.rotate}deg)`,
                        }}
                    >
                        <IconComponent size={item.size} strokeWidth={1} />
                    </div>
                );
            })}

            {/* Мягкие световые пятна */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200 dark:bg-emerald-900 rounded-full blur-3xl opacity-20 dark:opacity-10" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full blur-3xl opacity-20 dark:opacity-10" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full blur-3xl opacity-10 dark:opacity-5" />
        </div>
    );
}