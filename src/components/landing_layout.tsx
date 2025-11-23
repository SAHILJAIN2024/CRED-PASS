"use client";

import React from "react";
import Link from "next/link";
import { useWallet } from "@/src/components/WalletContext";

// =========================================================
//  Custom Header (No UI Libraries)
// =========================================================
export function Header() {
  const { address, connectWallet, disconnectWallet } = useWallet();

  return (
    <header className="py-4 px-6 bg-transparent sticky top-0 z-50 backdrop-blur-sm bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold text-xl">
            C
          </div>
          <span className="text-2xl font-bold text-white">Cred-Pass</span>
        </Link>

        

        {/* Wallet Button */}
        {address ? (
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm"
          >
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium text-black text-sm"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}

// =========================================================
//  Custom Footer
// =========================================================
export function Footer() {
  return (
    <footer className="py-6 px-6 border-t border-white/10 bg-white/5 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto text-center text-gray-300 text-sm">
        &copy; {new Date().getFullYear()} Cred-Pass. All Rights Reserved.
      </div>
    </footer>
  );
}

// =========================================================
//  Landing Layout Wrapper
// =========================================================
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full text-white font-sans overflow-hidden">

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/bg.mp4"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Page Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        {/* PAGE BODY */}
        <main className="flex-1 flex items-center justify-center py-10 px-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
}
