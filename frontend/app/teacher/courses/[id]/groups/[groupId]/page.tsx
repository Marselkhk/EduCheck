"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Upload, Trash2, FileText, FlaskConical, BookOpen, ClipboardList, Users, Plus, X, Award, CheckCircle2, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

interface Student {
    user_id: number;
    email: string;
    full_name: string;
}

interface Material {
    id: number;
    title: string;
    type: string;
    description: string | null;
    max_score: number;
    max_attempts: number;
    opens_at: string;
    deadline: string | null;
    closes_at: string | null;
}

interface Submission {
    id: number;
    material_id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    attempt_number: number;
    is_extra_attempt: boolean;
    is_final: boolean;
    file_path: string | null;
    text_answer: string | null;
    comment: string | null;
    score: number | null;
    teacher_comment: string | null;
    status: string;
    submitted_at: string;
    graded_at: string | null;
    is_test: boolean;
    test_auto_score: number | null;
    test_max_score: number | null;
    test_confirmed: boolean;
}

interface GradeStudent {
    student_id: number;
    user_id: number;
    full_name: string;
    email: string;
    status: string;
    total_score: number;
    max_possible: number;
    percentage: number;
}

export default function GroupPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const groupId = params.groupId as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [grades, setGrades] = useState<GradeStudent[]>([]);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [type, setType] = useState("lab");
    const [description, setDescription] = useState("");
    const [opensAt, setOpensAt] = useState("");
    const [deadline, setDeadline] = useState("");
    const [closesAt, setClosesAt] = useState("");
    const [maxScore, setMaxScore] = useState(10);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [showUploadForm, setShowUploadForm] = useState(false);

    const [openSubmissions, setOpenSubmissions] = useState<number | null>(null);
    const [submissions, setSubmissions] = useState<Record<number, Submission[]>>({});

    const [gradeModalOpen, setGradeModalOpen] = useState(false);
    const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
    const [gradeScore, setGradeScore] = useState(0);
    const [gradeComment, setGradeComment] = useState("");
    const [gradeMax, setGradeMax] = useState(10);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusStudentId, setStatusStudentId] = useState<number | null>(null);
    const [statusStudentName, setStatusStudentName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Тесты
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [testMaterialId, setTestMaterialId] = useState<number | null>(null);
    const [testQuestions, setTestQuestions] = useState<any[]>([]);
    const [testSaving, setTestSaving] = useState(false);

    const [curators, setCurators] = useState<any[]>([]);
    const [curatorModalOpen, setCuratorModalOpen] = useState(false);
    const [curatorEmail, setCuratorEmail] = useState("");
    const [curatorError, setCuratorError] = useState("");
    const [curatorLinking, setCuratorLinking] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    useEffect(() => {
        if (!token) {
            router.push("/login");
            return;
        }
        loadData();
        loadCurators();
    }, [courseId, groupId, router, token]);

    const loadData = () => {
        Promise.all([
            fetch(`http://localhost:8000/courses/${courseId}/groups/${groupId}/students`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch(`http://localhost:8000/materials/all/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
            fetch(`http://localhost:8000/grades/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then((res) => res.json()),
        ])
            .then(([studentsData, materialsData, gradesData]) => {
                setStudents(Array.isArray(studentsData) ? studentsData : []);
                setMaterials(Array.isArray(materialsData) ? materialsData : []);
                setGrades(gradesData.students || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const loadCurators = () => {
        fetch(`http://localhost:8000/curators/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setCurators(Array.isArray(data) ? data : []))
            .catch(() => { });
    };

    const uploadMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const formData = new FormData();
        formData.append("title", title);
        formData.append("type", type);
        formData.append("group_id", groupId);
        formData.append("opens_at", opensAt);
        if (deadline) formData.append("deadline", deadline);
        if (closesAt) formData.append("closes_at", closesAt);
        formData.append("max_score", maxScore.toString());
        formData.append("max_attempts", maxAttempts.toString());
        if (description) formData.append("description", description);
        if (file) formData.append("file", file);

        const res = await fetch("http://localhost:8000/materials/", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            const newMaterial = await res.json();
            setMaterials([...materials, newMaterial]);
            setTitle("");
            setDescription("");
            setOpensAt("");
            setDeadline("");
            setClosesAt("");
            setMaxScore(10);
            setMaxAttempts(1);
            setFile(null);
            setError("");
            setShowUploadForm(false);
        } else {
            const data = await res.json();
            setError(data.detail || "Ошибка загрузки");
        }
    };

    const deleteMaterial = async (materialId: number) => {
        if (!confirm("Удалить материал?")) return;

        try {
            const res = await fetch(`http://localhost:8000/materials/${materialId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setMaterials(materials.filter((m) => m.id !== materialId));
            } else {
                const data = await res.json().catch(() => ({}));
                alert("Ошибка удаления: " + (data.detail || res.status));
            }
        } catch (err) {
            alert("Ошибка соединения с сервером");
        }
    };

    const removeStudent = async (userId: number, fullName: string) => {
        if (!confirm(`Удалить студента "${fullName}" из группы? Все его сдачи будут удалены.`)) return;

        const res = await fetch(
            `http://localhost:8000/courses/${courseId}/groups/${groupId}/students/${userId}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (res.ok) {
            setStudents(students.filter((s) => s.user_id !== userId));
            setGrades(grades.filter((g) => g.user_id !== userId));
        } else {
            alert("Ошибка удаления студента");
        }
    };

    const toggleSubmissions = async (materialId: number) => {
        if (openSubmissions === materialId) {
            setOpenSubmissions(null);
            return;
        }
        setOpenSubmissions(materialId);

        const res = await fetch(`http://localhost:8000/submissions/material/${materialId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            setSubmissions({ ...submissions, [materialId]: data });
        }
    };

    const downloadSubmission = async (submissionId: number) => {
        try {
            const infoRes = await fetch(`http://localhost:8000/submissions/${submissionId}/file-info`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            let filename = `submission_${submissionId}`;
            if (infoRes.ok) {
                const info = await infoRes.json();
                filename = info.filename;
            }

            const res = await fetch(`http://localhost:8000/submissions/${submissionId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                alert("Ошибка скачивания");
                return;
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Ошибка соединения");
        }
    };

    const openGradeModal = (submissionId: number, maxScore: number, presetScore?: number) => {
        setGradingSubmissionId(submissionId);
        setGradeScore(presetScore || 0);
        setGradeComment("");
        setGradeMax(maxScore);
        setGradeModalOpen(true);
    };
    const submitGrade = async () => {
        if (!gradingSubmissionId) return;

        const res = await fetch(`http://localhost:8000/submissions/${gradingSubmissionId}/grade`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                score: gradeScore,
                teacher_comment: gradeComment,
            }),
        });

        if (res.ok) {
            setGradeModalOpen(false);
            if (openSubmissions) {
                const materialRes = await fetch(`http://localhost:8000/submissions/material/${openSubmissions}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (materialRes.ok) {
                    const data = await materialRes.json();
                    setSubmissions({ ...submissions, [openSubmissions]: data });
                }
            }
            const gradesRes = await fetch(`http://localhost:8000/grades/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (gradesRes.ok) {
                const data = await gradesRes.json();
                setGrades(data.students || []);
            }
        } else {
            alert("Ошибка сохранения оценки");
        }
    };

    const finalizeSubmission = async (submissionId: number) => {
        if (!confirm("Подтвердить работу? Студент больше не сможет пересдать.")) return;

        const res = await fetch(`http://localhost:8000/submissions/${submissionId}/finalize`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            if (openSubmissions) {
                const materialRes = await fetch(`http://localhost:8000/submissions/material/${openSubmissions}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (materialRes.ok) {
                    const data = await materialRes.json();
                    setSubmissions({ ...submissions, [openSubmissions]: data });
                }
            }
            const gradesRes = await fetch(`http://localhost:8000/grades/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (gradesRes.ok) {
                const data = await gradesRes.json();
                setGrades(data.students || []);
            }
            alert("Работа подтверждена. Попытки закрыты.");
        } else {
            alert("Ошибка подтверждения");
        }
    };

    const openStatusModal = (studentId: number, studentName: string) => {
        setStatusStudentId(studentId);
        setStatusStudentName(studentName);
        setStatusModalOpen(true);
    };

    const setStatus = async (status: string) => {
        if (!statusStudentId) return;

        const res = await fetch(`http://localhost:8000/students/${statusStudentId}/set-status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
        });

        if (res.ok) {
            setStatusModalOpen(false);
            const gradesRes = await fetch(`http://localhost:8000/grades/group/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (gradesRes.ok) {
                const data = await gradesRes.json();
                setGrades(data.students || []);
            }
        } else {
            alert("Ошибка сохранения статуса");
        }
    };

    const linkCurator = async (e: React.FormEvent) => {
        e.preventDefault();
        setCuratorError("");
        setCuratorLinking(true);

        const res = await fetch(`http://localhost:8000/curators/groups/${groupId}/link`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ curator_email: curatorEmail }),
        });

        const data = await res.json();
        setCuratorLinking(false);

        if (res.ok) {
            setCuratorModalOpen(false);
            setCuratorEmail("");
            loadCurators();
        } else {
            setCuratorError(data.detail || "Ошибка");
        }
    };

    const unlinkCurator = async (curatorId: number, curatorName: string) => {
        if (!confirm(`Отвязать куратора "${curatorName}"?`)) return;

        const res = await fetch(`http://localhost:8000/curators/${curatorId}/groups/${groupId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            loadCurators();
        } else {
            alert("Ошибка");
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case "automatic": return { label: "Автомат", color: "text-emerald-600", bg: "bg-emerald-50" };
            case "admitted": return { label: "Допуск", color: "text-amber-600", bg: "bg-amber-50" };
            case "not_admitted": return { label: "Недопуск", color: "text-red-600", bg: "bg-red-50" };
            default: return { label: "Не выcтавлен", color: "text-gray-500", bg: "bg-gray-100" };
        }
    };

    const typeLabel = (type: string) => {
        switch (type) {
            case "lecture": return "Лекция";
            case "lab": return "Лабораторная";
            case "hw": return "Домашнее задание";
            case "test": return "Тест";
            default: return type;
        }
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case "lecture": return <BookOpen className="w-5 h-5" />;
            case "lab": return <FlaskConical className="w-5 h-5" />;
            case "hw": return <FileText className="w-5 h-5" />;
            case "test": return <ClipboardList className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    // === ТЕСТЫ ===
    const openTestEditor = async (materialId: number) => {
        setTestMaterialId(materialId);
        setTestModalOpen(true);
        setTestQuestions([]);

        const res = await fetch(`http://localhost:8000/tests/${materialId}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setTestQuestions(data.map((q: any) => ({
                    question_text: q.question_text,
                    question_type: q.question_type,
                    options: q.options || [],
                    correct_answer: q.correct_answer || [],
                    time_limit: q.time_limit,
                    points: q.points,
                })));
            } else {
                addQuestion();
            }
        } else {
            addQuestion();
        }
    };

    const addQuestion = () => {
        setTestQuestions([
            ...testQuestions,
            {
                question_text: "",
                question_type: "single",
                options: ["", ""],
                correct_answer: [],
                time_limit: 60,
                points: 1,
            },
        ]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...testQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setTestQuestions(updated);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        const updated = [...testQuestions];
        updated[qIndex].options[oIndex] = value;
        setTestQuestions(updated);
    };

    const addOption = (qIndex: number) => {
        const updated = [...testQuestions];
        updated[qIndex].options.push("");
        setTestQuestions(updated);
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        const updated = [...testQuestions];
        updated[qIndex].options.splice(oIndex, 1);
        setTestQuestions(updated);
    };

    const toggleCorrectAnswer = (qIndex: number, option: string) => {
        const updated = [...testQuestions];
        const q = updated[qIndex];
        if (q.question_type === "single") {
            q.correct_answer = [option];
        } else {
            if (q.correct_answer.includes(option)) {
                q.correct_answer = q.correct_answer.filter((a: string) => a !== option);
            } else {
                q.correct_answer = [...q.correct_answer, option];
            }
        }
        setTestQuestions(updated);
    };

    const removeQuestion = (index: number) => {
        setTestQuestions(testQuestions.filter((_, i) => i !== index));
    };

    const saveTest = async () => {
        if (!testMaterialId) return;

        for (let i = 0; i < testQuestions.length; i++) {
            const q = testQuestions[i];
            if (!q.question_text.trim()) {
                alert(`Вопрос ${i + 1}: заполните текст вопроса`);
                return;
            }
            if (q.question_type !== "text" && q.options.some((o: string) => !o.trim())) {
                alert(`Вопрос ${i + 1}: заполните все варианты`);
                return;
            }
            if (q.correct_answer.length === 0) {
                alert(`Вопрос ${i + 1}: выберите правильный ответ`);
                return;
            }
        }

        setTestSaving(true);
        const res = await fetch("http://localhost:8000/tests/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                material_id: testMaterialId,
                questions: testQuestions,
            }),
        });
        setTestSaving(false);

        if (res.ok) {
            setTestModalOpen(false);
            alert("Тест сохранён!");
        } else {
            const data = await res.json();
            alert("Ошибка: " + (data.detail || "неизвестная"));
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-gray-500">Загрузка...</div>
            </main>
        );
    }

    const filteredStudents = students.filter((s) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });

    return (
        <main className="min-h-screen p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <Logo />
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => router.push(`/teacher/courses/${courseId}/groups/${groupId}/attendance`)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition shadow-lg shadow-cyan-500/30 text-sm font-medium"
                        >
                            📅 Посещаемость
                        </button>
                        <button
                            onClick={() => router.push(`/teacher/courses/${courseId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur border border-gray-200 rounded-xl hover:bg-white transition text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Назад к курсу
                        </button>
                    </div>
                </header>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Группа #{groupId}</h1>
                    <p className="text-gray-600 mt-1">
                        {students.length} студентов • {materials.length} материалов
                    </p>
                </div>



                {/* УСПЕВАЕМОСТЬ */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Award className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Успеваемость</h2>
                        </div>

                        {grades.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Студентов пока нет.</p>
                        ) : (
                            <div className="space-y-2">
                                {grades.map((g) => {
                                    const status = statusLabel(g.status);
                                    return (
                                        <div
                                            key={g.student_id}
                                            className="flex items-center justify-between p-3 bg-white/60 rounded-xl hover:bg-white transition"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {g.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{g.full_name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {g.total_score} / {g.max_possible} • {g.percentage}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                                <button
                                                    onClick={() => openStatusModal(g.student_id, g.full_name)}
                                                    className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                                                >
                                                    ✏️ Статус
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Кураторы */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/80 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 text-white text-lg">
                                    👁
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Кураторы ({curators.length})
                                </h2>
                            </div>
                            <button
                                onClick={() => setCuratorModalOpen(true)}
                                className="text-sm text-cyan-600 hover:underline font-medium"
                            >
                                + Привязать
                            </button>
                        </div>

                        {curators.length === 0 ? (
                            <p className="text-gray-500 text-center py-4 text-sm">
                                Кураторов нет. Привяжите куратора по email.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {curators.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between p-3 bg-white/60 rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                {c.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{c.full_name}</p>
                                                <p className="text-xs text-gray-500">{c.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => unlinkCurator(c.id, c.full_name)}
                                            className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                                        >
                                            Отвязать
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                {/* Студенты */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Студенты ({filteredStudents.length})
                            </h2>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="🔍 Поиск по ФИО или email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            />
                        </div>

                        {filteredStudents.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                {searchQuery ? "Ничего не найдено" : "Студентов пока нет. Они появятся, когда присоединятся к дисциплине."}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredStudents.map((s) => (
                                    <div
                                        key={s.user_id}
                                        className="group/student flex items-center justify-between p-3 bg-white/60 rounded-xl hover:bg-white transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                {s.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{s.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="w-4 h-4" />
                                                {s.email}
                                            </div>
                                            <button
                                                onClick={() => removeStudent(s.user_id, s.full_name)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover/student:opacity-100"
                                                title="Удалить студента"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Загрузка материала */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 mb-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <div className="flex justify-between items-center mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Загрузить материал</h2>
                            </div>
                            <button
                                onClick={() => setShowUploadForm(!showUploadForm)}
                                className="text-sm text-emerald-600 hover:underline font-medium"
                            >
                                {showUploadForm ? "Скрыть" : "Развернуть"}
                            </button>
                        </div>

                        {showUploadForm && (
                            <form onSubmit={uploadMaterial} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Название *</label>
                                    <input
                                        type="text"
                                        placeholder="Лаба 1. Калькулятор"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">Тип *</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    >
                                        <option value="lecture">📖 Лекция</option>
                                        <option value="lab">🧪 Лабораторная</option>
                                        <option value="hw">📝 Домашнее задание</option>
                                        <option value="test">✅ Тест</option>
                                    </select>
                                </div>

                                {type === "hw" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">
                                            Описание задания *
                                        </label>
                                        <textarea
                                            placeholder="Напишите задание здесь..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            required
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Открыть *</label>
                                        <input
                                            type="datetime-local"
                                            value={opensAt}
                                            onChange={(e) => setOpensAt(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Дедлайн</label>
                                        <input
                                            type="datetime-local"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Закрыть</label>
                                        <input
                                            type="datetime-local"
                                            value={closesAt}
                                            onChange={(e) => setClosesAt(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                                    💡 <strong>Открыть</strong> — когда студент увидит. <strong>Дедлайн</strong> — до какого времени сдать. <strong>Закрыть</strong> — когда исчезнет.
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Макс. балл *</label>
                                        <input
                                            type="number"
                                            value={maxScore}
                                            onChange={(e) => setMaxScore(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700">Попыток *</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={maxAttempts}
                                            onChange={(e) => setMaxAttempts(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700">
                                        Файл (необязательно)
                                    </label>
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-medium hover:file:bg-emerald-100 transition"
                                    />
                                </div>

                                {error && (
                                    <div className="text-red-600 text-sm bg-red-50/80 backdrop-blur p-3 rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-5 h-5" />
                                    Загрузить материал
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Материалы */}
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-200/50 border border-white/80 p-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl" />
                    <div className="relative">
                        <h2 className="text-xl font-bold text-gray-900 mb-5">
                            Материалы ({materials.length})
                        </h2>

                        {materials.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Материалов пока нет. Загрузите первый.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {materials.map((m) => (
                                    <div
                                        key={m.id}
                                        className="bg-white/60 rounded-xl border border-gray-100 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between p-4 group/material hover:bg-white transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                                    {typeIcon(m.type)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{m.title}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {typeLabel(m.type)} • макс. {m.max_score} баллов • {m.max_attempts} попыток
                                                    </p>
                                                    {m.description && (
                                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                                            {m.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {m.type === "test" && (
                                                    <button
                                                        onClick={() => openTestEditor(m.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition"
                                                    >
                                                        📝 Редактор теста
                                                    </button>
                                                )}
                                                {m.type !== "lecture" && (
                                                    <button
                                                        onClick={() => toggleSubmissions(m.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition"
                                                    >
                                                        {openSubmissions === m.id ? "Скрыть" : "Сдачи"}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteMaterial(m.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {openSubmissions === m.id && m.type !== "lecture" && (
                                            <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                                {!submissions[m.id] || submissions[m.id].length === 0 ? (
                                                    <p className="text-gray-500 text-sm text-center py-4">
                                                        Пока никто не сдал эту работу
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {Object.entries(
                                                            submissions[m.id].reduce((acc, s) => {
                                                                if (!acc[s.student_id]) {
                                                                    acc[s.student_id] = {
                                                                        student_name: s.student_name,
                                                                        student_email: s.student_email,
                                                                        submissions: []
                                                                    };
                                                                }
                                                                acc[s.student_id].submissions.push(s);
                                                                return acc;
                                                            }, {} as Record<number, { student_name: string; student_email: string; submissions: Submission[] }>)
                                                        ).map(([studentId, data]) => {
                                                            const studentSubs = data.submissions.sort((a, b) => a.attempt_number - b.attempt_number);
                                                            const finalSub = studentSubs.find(s => s.is_final);

                                                            return (
                                                                <div key={studentId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                                                {data.student_name.charAt(0).toUpperCase()}
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-semibold text-gray-900">{data.student_name}</p>
                                                                                <p className="text-xs text-gray-500">{data.student_email}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                                                                                {studentSubs.length} {studentSubs.length === 1 ? "попытка" : studentSubs.length < 5 ? "попытки" : "попыток"}
                                                                            </span>
                                                                            {finalSub && (
                                                                                <span className="text-xs px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                                                                    🔒 Подтверждено
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-4 space-y-3">
                                                                        {studentSubs.map((s) => (
                                                                            <div
                                                                                key={s.id}
                                                                                className={`rounded-xl p-4 border transition ${s.is_final
                                                                                    ? "border-purple-200 bg-purple-50/30"
                                                                                    : s.status === "graded"
                                                                                        ? "border-emerald-100 bg-emerald-50/20"
                                                                                        : "border-amber-100 bg-amber-50/20"
                                                                                    }`}
                                                                            >
                                                                                <div className="flex justify-between items-start gap-4">
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                                            {s.is_extra_attempt ? (
                                                                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                                                                                                    ⭐ Дополнительная попытка
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                                                                                                    Попытка #{s.attempt_number}
                                                                                                </span>
                                                                                            )}

                                                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === "graded"
                                                                                                ? "bg-emerald-50 text-emerald-700"
                                                                                                : "bg-amber-50 text-amber-700"
                                                                                                }`}>
                                                                                                {s.status === "graded" ? "✓ Оценено" : "⏳ На проверке"}
                                                                                            </span>

                                                                                            {s.is_final && (
                                                                                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                                                                                                    🔒 Финальная
                                                                                                </span>
                                                                                            )}
                                                                                        </div>

                                                                                        <p className="text-xs text-gray-500 mb-2">
                                                                                            📅 Сдано: {new Date(s.submitted_at).toLocaleString("ru")}
                                                                                        </p>

                                                                                        {s.comment && (
                                                                                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                                                <p className="text-xs font-medium text-gray-500 mb-1">💬 Комментарий:</p>
                                                                                                <p className="text-sm text-gray-700">{s.comment}</p>
                                                                                            </div>
                                                                                        )}

                                                                                        {s.text_answer && (
                                                                                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                                                                <p className="text-xs font-medium text-blue-600 mb-1">📝 Ответ:</p>
                                                                                                <p className="text-sm text-gray-800 whitespace-pre-wrap line-clamp-4">
                                                                                                    {s.text_answer}
                                                                                                </p>
                                                                                            </div>
                                                                                        )}

                                                                                        {s.file_path && (
                                                                                            <div className="mt-2 text-xs text-gray-500">
                                                                                                📎 Прикреплён файл
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Авто-балл теста (если есть и не подтверждён) */}
                                                                                        {s.is_test && s.test_auto_score !== null && s.score === null && (
                                                                                            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                                                                                <p className="text-xs font-medium text-amber-700 mb-1">🤖 Авто-проверка:</p>
                                                                                                <p className="text-lg font-bold text-amber-800">
                                                                                                    {s.test_auto_score} / {s.test_max_score}
                                                                                                </p>
                                                                                                <p className="text-xs text-amber-700 mt-1">
                                                                                                    Подтвердите или измените балл
                                                                                                </p>
                                                                                            </div>
                                                                                        )}

                                                                                        {/* Финальный балл */}
                                                                                        {s.score !== null && (
                                                                                            <div className="mt-3 flex items-center gap-2">
                                                                                                <span className="text-lg font-bold text-emerald-600">
                                                                                                    {s.score} / {m.max_score}
                                                                                                </span>
                                                                                                <span className="text-xs text-gray-500">
                                                                                                    ({Math.round((s.score / m.max_score) * 100)}%)
                                                                                                </span>
                                                                                                {s.is_test && s.test_confirmed && (
                                                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                                                                                        ✓ Подтверждено
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}

                                                                                        {s.teacher_comment && (
                                                                                            <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                                                                                <p className="text-xs font-medium text-emerald-600 mb-1">✍️ Ваш комментарий:</p>
                                                                                                <p className="text-sm text-gray-700">{s.teacher_comment}</p>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => router.push(`/teacher/students/${s.student_id}/group/${groupId}`)}
                                                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                                                        title="Открыть дневник студента"
                                                                                    >
                                                                                        📔 Дневник
                                                                                    </button>
                                                                                    <div className="flex flex-col gap-2">
                                                                                        {s.file_path && (
                                                                                            <button
                                                                                                onClick={() => downloadSubmission(s.id)}
                                                                                                className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                                                                                            >
                                                                                                📥 Скачать
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={() => openGradeModal(s.id, m.max_score, s.test_auto_score || undefined)}
                                                                                            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
                                                                                        >
                                                                                            {s.is_test && s.test_auto_score !== null && s.score === null
                                                                                                ? "✓ Подтвердить"
                                                                                                : s.status === "graded"
                                                                                                    ? "✏️ Изменить"
                                                                                                    : "✓ Оценить"}
                                                                                        </button>

                                                                                        {!s.is_final && s.status === "graded" && (
                                                                                            <button
                                                                                                onClick={() => finalizeSubmission(s.id)}
                                                                                                className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                                                                                title="Подтвердить и закрыть попытки"
                                                                                            >
                                                                                                🔒 Подтвердить
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Модалка оценки */}
            {gradeModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setGradeModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Оценка работы</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Балл (0 — {gradeMax})
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={gradeMax}
                                    value={gradeScore}
                                    onChange={(e) => setGradeScore(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Комментарий
                                </label>
                                <textarea
                                    value={gradeComment}
                                    onChange={(e) => setGradeComment(e.target.value)}
                                    rows={3}
                                    placeholder="Что не так / что хорошо"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setGradeModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={submitGrade}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition font-medium shadow-lg shadow-emerald-500/30"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка статуса */}
            {statusModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setStatusModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Статус студента</h2>
                        <p className="text-gray-500 text-sm mb-6">{statusStudentName}</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => setStatus("automatic")}
                                className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition text-left"
                            >
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                <div>
                                    <p className="font-semibold text-emerald-900">Автомат</p>
                                    <p className="text-sm text-emerald-700">Студент получает оценку автоматически</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStatus("admitted")}
                                className="w-full flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition text-left"
                            >
                                <Award className="w-6 h-6 text-amber-600" />
                                <div>
                                    <p className="font-semibold text-amber-900">Допуск</p>
                                    <p className="text-sm text-amber-700">Студент допущен к экзамену</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStatus("not_admitted")}
                                className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition text-left"
                            >
                                <XCircle className="w-6 h-6 text-red-600" />
                                <div>
                                    <p className="font-semibold text-red-900">Недопуск</p>
                                    <p className="text-sm text-red-700">Студент не допущен к экзамену</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStatus("not_set")}
                                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition text-left"
                            >
                                <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                                <div>
                                    <p className="font-semibold text-gray-900">Сбросить</p>
                                    <p className="text-sm text-gray-700">Статус не выставлен</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка редактора теста */}
            {testModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">📝 Редактор теста</h2>
                            <button
                                onClick={() => setTestModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {testQuestions.map((q, qIndex) => (
                                <div key={qIndex} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-bold text-gray-900">Вопрос #{qIndex + 1}</span>
                                        <button
                                            onClick={() => removeQuestion(qIndex)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            🗑 Удалить
                                        </button>
                                    </div>

                                    <textarea
                                        placeholder="Текст вопроса..."
                                        value={q.question_text}
                                        onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />

                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-gray-600">Тип</label>
                                            <select
                                                value={q.question_type}
                                                onChange={(e) => {
                                                    updateQuestion(qIndex, "question_type", e.target.value);
                                                    updateQuestion(qIndex, "correct_answer", []);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                            >
                                                <option value="single">Один ответ</option>
                                                <option value="multiple">Несколько</option>
                                                <option value="text">Текст</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Время (сек)</label>
                                            <input
                                                type="number"
                                                value={q.time_limit}
                                                onChange={(e) => updateQuestion(qIndex, "time_limit", Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Балл</label>
                                            <input
                                                type="number"
                                                value={q.points}
                                                onChange={(e) => updateQuestion(qIndex, "points", Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    {q.question_type !== "text" && (
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-600">Варианты ответов (отметьте правильный):</label>
                                            {q.options.map((opt: string, oIndex: number) => (
                                                <div key={oIndex} className="flex gap-2 items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCorrectAnswer(qIndex, opt)}
                                                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition ${q.correct_answer.includes(opt)
                                                            ? "bg-emerald-500 border-emerald-500"
                                                            : "border-gray-300 hover:border-emerald-300"
                                                            }`}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const oldVal = q.options[oIndex];
                                                            updateOption(qIndex, oIndex, e.target.value);
                                                            if (q.correct_answer.includes(oldVal)) {
                                                                const updated = [...testQuestions];
                                                                updated[qIndex].correct_answer = updated[qIndex].correct_answer.map((a: string) =>
                                                                    a === oldVal ? e.target.value : a
                                                                );
                                                                setTestQuestions(updated);
                                                            }
                                                        }}
                                                        placeholder={`Вариант ${oIndex + 1}`}
                                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                                    />
                                                    {q.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(qIndex, oIndex)}
                                                            className="text-red-500 hover:text-red-700 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => addOption(qIndex)}
                                                className="text-sm text-purple-600 hover:underline"
                                            >
                                                + Добавить вариант
                                            </button>
                                        </div>
                                    )}

                                    {q.question_type === "text" && (
                                        <div>
                                            <label className="text-xs text-gray-600">Правильный ответ:</label>
                                            <input
                                                type="text"
                                                value={q.correct_answer[0] || ""}
                                                onChange={(e) => updateQuestion(qIndex, "correct_answer", [e.target.value])}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mt-1"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={addQuestion}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                            >
                                + Добавить вопрос
                            </button>
                            <button
                                onClick={saveTest}
                                disabled={testSaving || testQuestions.length === 0}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-purple-500/30"
                            >
                                {testSaving ? "Сохранение..." : "Сохранить тест"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Модалка привязки куратора */}
            {curatorModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setCuratorModalOpen(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">👁 Привязать куратора</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            Введите email куратора, который зарегистрировался на платформе
                        </p>

                        <form onSubmit={linkCurator} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Email куратора</label>
                                <input
                                    type="email"
                                    value={curatorEmail}
                                    onChange={(e) => setCuratorEmail(e.target.value)}
                                    required
                                    placeholder="curator@example.com"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            {curatorError && (
                                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                                    {curatorError}
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCuratorModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={curatorLinking}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 transition font-medium shadow-lg shadow-cyan-500/30"
                                >
                                    {curatorLinking ? "Привязка..." : "Привязать"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}