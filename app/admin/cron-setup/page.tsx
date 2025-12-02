"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink } from "lucide-react";
import { useEffect } from "react";

export default function CronSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const cronUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/cron/notify`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("คัดลอกแล้ว!");
  };

  return (
    <div className="min-h-screen bg-pink-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            ⏰ ตั้งค่าการแจ้งเตือนอัตโนมัติ
          </h1>
          <p className="text-gray-600 mb-6">
            ตั้งค่า Cron Job เพื่อให้ระบบแจ้งเตือนอัตโนมัติก่อน Handshake 15 นาที
          </p>

          {/* Method 1: Vercel */}
          <div className="mb-8 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
              🚀 วิธีที่ 1: Vercel Cron (แนะนำ)
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              ใช้ได้เฉพาะเมื่อ deploy บน Vercel เท่านั้น
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200 mb-3">
              <p className="text-xs text-gray-600 mb-2 font-semibold">ไฟล์ vercel.json (สร้างแล้ว):</p>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/notify",
      "schedule": "* * * * *"
    }
  ]
}`}
              </pre>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>หมายเหตุ:</strong> Vercel Free Plan รองรับ cron แค่ <strong>1 ครั้งต่อวัน</strong> 
                ถ้าต้องการรันทุกนาที ต้องอัพเกรด Hobby Plan ($20/เดือน)
              </p>
            </div>
          </div>

          {/* Method 2: External Service */}
          <div className="mb-8 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <h2 className="text-lg sm:text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
              🌐 วิธีที่ 2: External Cron Service (ฟรี)
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              ใช้บริการภายนอกเรียก API ทุกนาที - ใช้ได้ทั้ง development และ production
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  URL ที่ต้องเรียก:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cronUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(cronUrl)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Schedule:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="* * * * *"
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard("* * * * *")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-semibold"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">* * * * * = ทุกนาที</p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  บริการ Cron ฟรีที่แนะนำ:
                </p>
                <div className="space-y-2">
                  <a
                    href="https://cron-job.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">cron-job.org</div>
                      <div className="text-xs text-gray-500">ฟรี, ง่าย, รองรับทุกนาที</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </a>
                  
                  <a
                    href="https://www.easycron.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">EasyCron</div>
                      <div className="text-xs text-gray-500">ฟรี, รองรับทุกนาที</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </a>

                  <a
                    href="https://uptimerobot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-gray-800 text-sm">UptimeRobot</div>
                      <div className="text-xs text-gray-500">ฟรี, แต่รองรับแค่ทุก 5 นาที</div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600" />
                  </a>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  📖 ขั้นตอนการตั้งค่า (cron-job.org):
                </p>
                <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>สมัครสมาชิก (ฟรี)</li>
                  <li>กด "Create cronjob"</li>
                  <li>ใส่ URL ที่ copy ไว้ข้างบน</li>
                  <li>ตั้ง Schedule: Every minute (* * * * *)</li>
                  <li>กด Save</li>
                  <li>✅ เสร็จแล้ว! ระบบจะแจ้งเตือนอัตโนมัติ</li>
                </ol>
              </div>
            </div>
          </div>

          {/* For Development */}
          <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h2 className="text-lg sm:text-xl font-bold text-purple-900 mb-3">
              🧪 สำหรับ Development (Local)
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              เมื่อทดสอบบน localhost ให้ใช้ <strong>ngrok</strong> หรือ <strong>localtunnel</strong> เพื่อเปิด localhost ให้ภายนอกเข้าถึงได้
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-purple-200 mb-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">ติดตั้ง ngrok:</p>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
npm install -g ngrok
# หรือ
bun add -g ngrok
              </pre>
            </div>

            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">รัน ngrok:</p>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
ngrok http 3000
              </pre>
              <p className="text-xs text-gray-600 mt-2">
                จะได้ URL แบบ: <code className="bg-gray-100 px-1 py-0.5 rounded">https://xxxx.ngrok.io</code>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ใช้ URL นี้ตั้งค่า Cron: <code className="bg-gray-100 px-1 py-0.5 rounded">https://xxxx.ngrok.io/api/cron/notify</code>
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

