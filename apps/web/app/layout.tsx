import "./globals.css";
import type { Metadata } from "next";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";


export const metadata: Metadata = {
  title: "TestPortal",
  description: "Create and join online tests with AI-assisted question generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-hero min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
