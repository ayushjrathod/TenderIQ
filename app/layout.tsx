import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TenderIQ",
  description: "Tender management and analysis platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">
          <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <Button className="text-2xl font-bold" variant="ghost">
                  Construction - TenderIQ
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost">Home</Button>
                </Link>
                <Link href="/summary">
                  <Button variant="ghost">Upload and Summarize</Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost">About</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost">Contact</Button>
                </Link>
              </div>
            </div>
          </nav>
          <main className="flex-1 container mx-auto py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
