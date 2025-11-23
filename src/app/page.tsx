"use client";

import React from "react";
import Navbar from "@/src/components/navbar_home";
import { useWallet } from "../components/WalletContext";
import { useRouter } from "next/navigation";
import Signup from "@/src/components/signup";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { address } = useWallet();

  return (
    <div className="relative min-h-screen w-full text-white font-sans overflow-hidden">

      {/* ===== Background Video ===== */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* ===== Gradient Overlay ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />

      {/* ===== Main Content ===== */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />

        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12">
          <div className="text-center max-w-4xl">

            {/* Section Header */}
            <p className="text-cyan-300 tracking-widest font-bold text-lg md:text-xl">
              YOUR ACHIEVEMENTS
            </p>

            {/* Main Title */}
            <div className="mt-6 leading-tight">
              <h1 className="text-6xl md:text-8xl font-light">
                Categorized &<br />
                <span className="font-bold italic">Verified.</span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="mt-6 text-white/80 text-xl md:text-3xl leading-relaxed">
              The decentralized student passport. <br />
              Secure, immutable, and privacy-preserving.
            </p>

            {/* Signup Component */}
            <div className="mt-12 flex justify-center">
              <Signup />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
