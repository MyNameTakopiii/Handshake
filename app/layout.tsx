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
  title: "Handshake Planner - BNK48 & CGM48",
  description: "วางแผนงานจับมือ BNK48 & CGM48 ได้ง่ายๆ พร้อมระบบแจ้งเตือนผ่าน LINE",
  keywords: ["BNK48", "CGM48", "Handshake", "Event", "Planner", "จับมือ", "ไอดอล"],
  authors: [{ name: "Handshake Planner Team" }],
  openGraph: {
    title: "Handshake Planner - BNK48 & CGM48",
    description: "วางแผนงานจับมือ BNK48 & CGM48 ได้ง่ายๆ พร้อมระบบแจ้งเตือนผ่าน LINE",
    siteName: "Handshake Planner",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "Handshake Planner - BNK48 & CGM48",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Handshake Planner - BNK48 & CGM48",
    description: "วางแผนงานจับมือ BNK48 & CGM48 ได้ง่ายๆ พร้อมระบบแจ้งเตือนผ่าน LINE",
    images: ["/image.png"],
  },
  icons: {
    icon: "/image.png",
    apple: "/image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={prompt.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
