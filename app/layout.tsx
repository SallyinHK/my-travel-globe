import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 网页标题和描述（我帮你修改成专业的了！）
export const metadata: Metadata = {
  title: "My Travel Globe",
  description: "A 3D interactive travel footprint tracker.",
};

// 🔒 这里就是紧箍咒：锁定移动端缩放比例，解决苹果手机自动放大的问题
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html> 
  );
}