"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 ml-64 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
