"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function TestNotificationsPage() {
    const { data: session, status } = useSession();
    const [testTime, setTestTime] = useState("");
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [testResult, setTestResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleDebug = async () => {
        setLoading(true);
        setDebugInfo(null);
        try {
            const res = await fetch("/api/test/cron-debug");
            const data = await res.json();
            setDebugInfo(data);
        } catch (error) {
            setDebugInfo({ error: String(error) });
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!testTime) {
            alert("กรุณาเลือกเวลาที่ต้องการทดสอบ");
            return;
        }

        setLoading(true);
        setTestResult(null);
        try {
            const res = await fetch("/api/test/scheduled-notify-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testTime }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch (error) {
            setTestResult({ error: String(error) });
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            ทดสอบระบบแจ้งเตือน
                        </h1>
                        <p className="text-gray-600 mb-6">
                            กรุณา Login ด้วย LINE เพื่อใช้งานระบบทดสอบ
                        </p>
                        <button
                            onClick={() => signIn("line")}
                            className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.771.039 1.078l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                            Login ด้วย LINE
                        </button>
                        <p className="text-sm text-gray-500 mt-4">
                            ⓘ คุณต้อง Add Friend LINE Bot ก่อนถึงจะรับ notification ได้
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🧪 ทดสอบระบบแจ้งเตือน
                    </h1>
                    <p className="text-gray-600">
                        สวัสดี <span className="font-semibold text-pink-600">{session.user?.name}</span>
                    </p>
                </div>

                {/* Debug Section */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        🔍 ตรวจสอบสถานะปัจจุบัน
                    </h2>
                    <p className="text-gray-600 mb-4">
                        ดูว่าตอนนี้มี rounds อะไรบ้างที่จะเริ่มในอีก 15 นาที
                    </p>
                    <button
                        onClick={handleDebug}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        {loading ? "กำลังโหลด..." : "ตรวจสอบสถานะ"}
                    </button>

                    {debugInfo && (
                        <div className="mt-6 bg-gray-50 rounded-lg p-4 overflow-auto">
                            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Test Section */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        ⏰ ทดสอบการแจ้งเตือน
                    </h2>
                    <p className="text-gray-600 mb-4">
                        เลือกเวลาที่ event จะเริ่ม แล้วระบบจะส่ง notification ทดสอบไปที่ LINE ของคุณ
                        (จำลองว่าส่งก่อนเวลา 15 นาที)
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            เวลาที่ Event จะเริ่ม
                        </label>
                        <input
                            type="datetime-local"
                            value={testTime}
                            onChange={(e) => setTestTime(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            เช่น: 2025-12-07T22:00 (ตอนนี้คือ {new Date().toLocaleString('th-TH')})
                        </p>
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={loading || !testTime}
                        className="bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        {loading ? "กำลังส่ง..." : "ส่ง Test Notification"}
                    </button>

                    {testResult && (
                        <div className="mt-6">
                            <div className={`rounded-lg p-4 ${testResult.success
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                <h3 className={`font-semibold mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    {testResult.success ? '✅ ส่งสำเร็จ!' : '❌ เกิดข้อผิดพลาด'}
                                </h3>
                                <div className="bg-white rounded p-3 overflow-auto">
                                    <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                        {JSON.stringify(testResult, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                        💡 คำแนะนำ
                    </h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                        <li>คุณต้อง Add Friend LINE Bot ก่อนถึงจะรับ notification ได้</li>
                        <li>ต้องมี booking สำหรับเวลาที่ต้องการทดสอบ</li>
                        <li>ใช้ "ตรวจสอบสถานะ" เพื่อดูว่ามี rounds อะไรบ้างในวันนี้</li>
                        <li>Cron job จะทำงานทุก 1 นาที และส่ง notification ก่อนเวลา 15 นาที</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
