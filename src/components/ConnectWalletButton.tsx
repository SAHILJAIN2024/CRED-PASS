// src/components/ConnectWalletButton.tsx

"use client";

import React from "react";
import { useWallet } from "../components/WalletContext";
import styles from "../styles/ConnectWalletButton.module.css";

const ConnectWalletButton: React.FC = () => {
  const { address, connectWallet } = useWallet();

  return (
    <button onClick={connectWallet} className={styles.button}>
      {address ? `🦊 Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "🔌 Connect Wallet"}
    </button>
  );
};

export default ConnectWalletButton;
