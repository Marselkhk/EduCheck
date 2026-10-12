import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";
import ThemeToggle from "@/components/ThemeToggle";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "EduCheck — платформа для учебного процесса",
  description: "Автоматизация учебного процесса для преподавателей и студентов",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} relative`}>
        <Background />
        <div className="relative z-10">{children}</div>

        {/* Переключатель темы — фиксированный в правом верхнем углу */}
        <div className="fixed top-6 right-6 z-50">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}