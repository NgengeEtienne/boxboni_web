import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const interFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Waypoint",
  description: "Field location registration",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${interFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-(--background)">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
