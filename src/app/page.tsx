"use client";

import React from "react";
import { useWallet } from "../components/WalletContext";
import { useRouter } from "next/navigation";
import Signup from "@/src/components/signup";
import { Header, Footer } from "@/src/components/landing_layout";

import { CheckCircle, Bot } from "lucide-react"; // Icons for features

// Feature Component
const Feature = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl text-center">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300 text-sm">{description}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { address } = useWallet();

  return (
    <div className="relative min-h-screen w-full text-white font-sans overflow-hidden">

      {/* ========= Background Video ========= */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/bg.mp4"
      />

      {/* ========= Dark Overlay ========= */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

      {/* ========= Page Content ========= */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header */}
        <Header />

        {/* ========= HERO SECTION ========= */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 pt-32">
          <div className="text-center max-w-4xl">

            <p className="text-blue-300 tracking-[0.3em] text-sm md:text-lg font-semibold">
              YOUR ACHIEVEMENTS
            </p>

            <h1 className="mt-6 text-5xl md:text-7xl font-extralight leading-tight">
              Categorized &
              <br />
              <span className="font-bold italic text-white">Verified.</span>
            </h1>

            <p className="mt-6 text-white/80 text-lg md:text-2xl leading-relaxed">
              The decentralized student passport.
              <br />
              Secure, immutable, and privacy-preserving.
            </p>

            <div className="mt-10 flex justify-center">
              <div className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 w-full max-w-lg">
                <Signup />
              </div>
              <button className="bg-white/10 backdrop-blur-xl p-6 md:p-8 rounded-2xl shadow-xl border border-white/20 w-full max-w-lg ml-6 hidden md:block " onClick={()=>{router.push("./prposal")}}>
                <div className=" hover:shadow-[0_0_15px_#FF2E88] animate-pulse">
                Apply for Institute Verification
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ========= FEATURES SECTION ========= */}
        <section id="features" className="py-16 px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Cred-Pass?</h2>
            <p className="mt-2 text-gray-300">
              Secure, Instant, and Trusted Verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

            <Feature
              icon={<CheckCircle className="h-8 w-8 text-cyan-400" />}
              title="Instant Verification"
              description="Employers can instantly verify credentials with an AI-powered confidence score, reducing hiring friction."
            />

            <Feature
              icon={<Bot className="h-8 w-8 text-cyan-400" />}
              title="Blockchain Security"
              description="Certificates are issued on-chain and tamper-proof with global accessibility."
            />

            <Feature
              icon={<Bot className="h-8 w-8 text-cyan-400" />}
              title="AI-Powered Fraud Detection"
              description="Our system analyzes certificate data to identify and flag potential fraud, ensuring integrity."
            />

          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
