import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "LMS Platform",
  description: "Learn from the best instructors online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en" className={geist.variable}>
      <body>
        <Toaster position="bottom-right" richColors />
        {children}
      </body>
    </html>
  );

  if (!publishableKey) {
    return content;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" className={geist.variable}>
        <body>
          <Toaster position="bottom-right" richColors />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
