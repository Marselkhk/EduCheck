import Link from "next/link";
import { BookOpen, Users, Award, CheckCircle2, ArrowRight, Zap, Shield, Clock, UserCheck, Eye } from "lucide-react";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Шапка */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-medium transition"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/30 font-medium"
          >
            Начать
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-6 border border-emerald-100 dark:border-emerald-900">
            <Zap className="w-4 h-4" />
            Бесплатно для преподавателей и студентов
          </div>

          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Учебный процесс
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              в одном месте
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            EduCheck помогает преподавателям создавать курсы, загружать материалы и проверять работы. Студенты сдают задания онлайн и следят за оценками.
          </p>

          {/* Четыре кнопки */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link
              href="/register/teacher"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition shadow-xl shadow-emerald-500/30 font-semibold text-lg"
            >
              <BookOpen className="w-5 h-5" />
              Преподаватель
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register/student"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-slate-800 transition font-semibold text-lg"
            >
              <Users className="w-5 h-5" />
              Студент
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register/parent"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 transition font-semibold text-lg"
            >
              <UserCheck className="w-5 h-5" />
              Родитель
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register/curator"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-2xl hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-white dark:hover:bg-slate-800 transition font-semibold text-lg"
            >
              <Eye className="w-5 h-5" />
              Куратор
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Всё, что нужно для учёбы
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Простой интерфейс. Мощный функционал.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { Icon: BookOpen, title: "Курсы и материалы", desc: "Создавайте курсы, группы, загружайте лекции, лабы и тесты.", color: "emerald" },
            { Icon: Users, title: "Группы студентов", desc: "Студенты присоединяются по коду курса. Автоматическое добавление.", color: "blue" },
            { Icon: Award, title: "Оценки и допуск", desc: "Автоматический расчёт баллов и определение допуска к экзамену.", color: "purple" },
            { Icon: Clock, title: "Дедлайны", desc: "Устанавливайте даты открытия и дедлайны для каждой работы.", color: "amber" },
            { Icon: Shield, title: "Безопасность", desc: "Пароли зашифрованы. Данные защищены. Никакого спама.", color: "cyan" },
            { Icon: CheckCircle2, title: "Простота", desc: "Никаких сложных настроек. Начал работу за 2 минуты.", color: "rose" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 dark:border-slate-700/80 p-6 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-${item.color}-400/20 to-${item.color}-400/20 rounded-full blur-2xl`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 flex items-center justify-center mb-4 shadow-lg`}>
                  <item.Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl shadow-emerald-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-emerald-50 text-lg mb-8">
              Зарегистрируйтесь за 2 минуты и начните использовать EduCheck
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-2xl hover:bg-emerald-50 transition shadow-xl font-semibold text-lg"
            >
              Создать аккаунт
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200 dark:border-slate-800 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 EduCheck. Учебный проект.
          </p>
        </div>
      </footer>
    </main>
  );
}