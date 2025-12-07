import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";  

const prompt = Prompt({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"], // โหลดความหนาที่ต้องใช้
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "Handshake Planner",
  description: "BNK48 & CGM48 Event Planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={prompt.className}>
        {/* ✅ ต้องเอา Providers มาครอบ children ตรงนี้ครับ */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html> 
  );
}
