"use client";

import React, { useState } from "react";
import { useWallet } from "../../components/WalletContext";
import { useRouter } from "next/navigation";

const ADMIN_WALLET = "0xfc6ec2f8cfb9bd4727bb1b2b6a6976610abcff47";

const AdminDashboard: React.FC = () => {
  const { address } = useWallet();
  const [account, setAccount] = useState<string | null>(address ?? null);
  const router = useRouter();

  // ===== Institution Registration Form =====
  const [name, setName] = useState("");
  const [uri, setUri] = useState("");
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState("");

  // ===== Admin Sign-In =====
  const [adminStatus, setAdminStatus] = useState("");

  // Connect Wallet
  const connectWallet = async () => {
    try {
      const provider = (window as any).ethereum;
      if (!provider) throw new Error("MetaMask not installed");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const acct = accounts?.[0] ?? null;
      setAccount(acct);

      if (acct) {
        setStatus("Connected to " + acct);
      }
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  // Simulate Apply for Verification
  const applyForVerification = async () => {
    if (!account) return alert("⚠️ Connect wallet first");
    if (!name || !uri || !wallet) return alert("⚠️ Fill all fields");

    setStatus("Uploading application data...");
    // Simulate network delay
    setTimeout(() => {
      setStatus(`✅ Application data uploaded!\nName: ${name}\nURI: ${uri}\nWallet: ${wallet}`);
      setName("");
      setUri("");
      setWallet("");
    }, 1000);
  };

  // Admin Sign-In (restricted to specific wallet)
  const adminSignIn = () => {
    if (!account) return alert("⚠️ Connect wallet first");

    if (account.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
      router.push("/repository");
    } else {
      setAdminStatus("❌ You are not authorized as admin");
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white font-sans overflow-hidden">
      {/* Background */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="/bg.mp4" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

      <div className="relative z-10 flex flex-col min-h-screen items-center pt-20 px-4 space-y-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">🏫 DAO Institute Dashboard</h1>

        {/* ===== Institution Registration Form ===== */}
        <div className="max-w-xl w-full bg-[#0F2027] p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-center">Institution Registration</h2>
          <input
            type="text"
            placeholder="Institute Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="Metadata URI"
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="Wallet Address"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />

          {!account && (
            <button
              onClick={connectWallet}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-semibold text-lg transition-all"
            >
              Connect Wallet
            </button>
          )}

          {account && (
            <button
              onClick={applyForVerification}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-semibold text-lg transition-all"
            >
              Submit Application
            </button>
          )}

          {status && <p className="text-center text-white/70 mt-2 whitespace-pre-line">{status}</p>}
        </div>

        {/* ===== Admin Sign-In ===== */}
        <div className="max-w-xl w-full bg-[#0F2027] p-8 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <h2 className="text-2xl font-semibold mb-4 text-center">Admin Sign-In</h2>
          {!account && (
            <button
              onClick={connectWallet}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-semibold text-lg transition-all"
            >
              Connect Wallet
            </button>
          )}
          {account && (
            <button
              onClick={adminSignIn}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-semibold text-lg transition-all"
            >
              Sign In as Admin
            </button>
          )}
          {adminStatus && <p className="text-center text-white/70 mt-2">{adminStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
