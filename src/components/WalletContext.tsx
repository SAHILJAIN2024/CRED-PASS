"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { MetaMaskInpageProvider } from "@metamask/providers";

// Extend window.ethereum with correct typing
declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("🦊 Please install MetaMask!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Make sure MetaMask is connected.");
      }

      const ethProvider = new ethers.BrowserProvider(window.ethereum as any);
      const ethSigner = await ethProvider.getSigner();
      const userAddress = await ethSigner.getAddress();

      setProvider(ethProvider);
      setSigner(ethSigner);
      setAddress(userAddress);

      console.log("✅ Wallet connected:", userAddress);
    } catch (error: any) {
      console.error("🚨 Wallet connection failed:", error?.message || error);

      if (error.code === 4001) {
        alert("⛔ You rejected the connection request.");
      } else {
        alert("❌ Wallet connection failed: " + (error?.message || "Unknown error"));
      }
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    console.log("🔌 Wallet disconnected");
  }

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", connectWallet);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
        window.ethereum.removeListener("chainChanged", () => window.location.reload());
      }
    };
  }, []);

  return (
    <WalletContext.Provider value={{ address, provider, signer, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
};
