// src/components/ConnectWalletButton.tsx

"use client";

import React from "react";
import { useWallet } from "../components/WalletContext";

const ConnectWalletButton: React.FC = () => {
  const { address, connectWallet } = useWallet();

  return (
    <button className=" w-5px bg-blue-400 pt-10 text-center justify-between "onClick={connectWallet}>
      {address ? `🦊 Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "🔌 Connect Wallet"}
    </button>
  );
};

export default ConnectWalletButton;
