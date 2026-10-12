import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-all duration-300">
                EC
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-gray-100 tracking-tight">
                EduCheck
            </span>
        </Link>
    );
}