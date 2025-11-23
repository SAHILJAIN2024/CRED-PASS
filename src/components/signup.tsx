"use client";

import React, { useEffect } from "react";
import { useWallet } from "../components/WalletContext";
import { useRouter, usePathname } from "next/navigation";

const Signup: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { address, connectWallet } = useWallet();

  // Redirect only if we are on "/" and wallet connects
  useEffect(() => {
    if (address && pathname === "/") {
      router.push("/dashboard");
    }
  }, [address, pathname, router]);

  return (
    <button
      onClick={connectWallet}
      className={`w-full h-14 border border-white/40 font-semibold tracking-wide rounded-lg backdrop-blur-sm transition duration-300 flex flex-col justify-center items-center ${
        address
          ? "bg-[#39FF14] text-black shadow-[0_0_15px_#39FF14] hover:shadow-[0_0_25px_#39FF14]"
          : "bg-white/10 text-white shadow-[0_0_10px_#9D00FF] hover:shadow-[0_0_15px_#FF2E88] animate-pulse"
      }`}
    >
      {address ? (
        <span className="text-sm">🔗 Wallet Connected</span>
      ) : (
        <>
          <span className="text-sm">⚡ Connect Wallet</span>
          <span className="text-xs opacity-80">Step into Web3 🚀</span>
        </>
      )}
    </button>
  );
};

export default Signup;
