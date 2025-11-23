"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "@/src/contractABI/contractABI.json";
import Navbar from "@/src/components/navbar";

interface RepoMetadata {
  metadataUri: string;
}

const CONTRACT_ADDRESS = "0x25b3ebF0baFeF6Db784E8E02A80aBa96686bcd30";

export default function Repository() {
  const [address, setAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isIssuer, setIsIssuer] = useState<boolean>(false);

  const [repoName, setRepoName] = useState<string>("");
  const [repoDesc, setRepoDesc] = useState<string>("");
  const [repoTech, setRepoTech] = useState<string>("");
  const [repoContributor, setRepoContributor] = useState<string>("");
  const [repoFile, setRepoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  // Connect wallet
  const connectWallet = async () => {
    if (!(window as any).ethereum) return alert("⚠️ Please install MetaMask!");
    try {
      const [account] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setAddress(account);
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  };

  // Initialize contract and check issuer
  useEffect(() => {
    if (!address) return;

    const setupContract = async () => {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);
        setContract(contractInstance);

        // Check ISSUER_ROLE
        const roleBytes: string = await contractInstance.ISSUER_ROLE();
        const issuer: boolean = await contractInstance.hasRole(roleBytes, address);
        setIsIssuer(issuer);

        console.log("✅ Contract initialized, issuer status:", issuer);
      } catch (err) {
        console.error("❌ Error initializing contract:", err);
      }
    };

    setupContract();
  }, [address]);

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!address) return alert("⚠️ Connect your wallet first");
  if (!repoFile) return alert("⚠️ Select a file to upload");
  if (!contract) return alert("⚠️ Contract not initialized yet");
  if (!isIssuer) return alert("⚠️ Your wallet is not authorized to mint credentials.");

  setLoading(true);
  setStatus("Uploading to IPFS...");

  try {
    // Upload metadata to backend
    const formData = new FormData();
    formData.append("ownerAddress", address);
    formData.append("name", repoName);
    formData.append("description", repoDesc);
    formData.append("tech", repoTech);
    formData.append("contributor", repoContributor);
    formData.append("file", repoFile);

    const res = await fetch("http://localhost:5000/api/repo", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Backend upload failed");
    const data: RepoMetadata = await res.json();

    setStatus("Minting on blockchain...");

    const expiryTs = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600);
    const createTBA = true;

    // Mint credential
    const tx = await (contract as any).mintCred(address, data.metadataUri, expiryTs, createTBA, {
      gasLimit: 500_000,
    });

    setStatus("Transaction sent, waiting for confirmation...");
    const receipt = await tx.wait();
    if (!receipt) throw new Error("Transaction failed: receipt missing");

    // Parse CredentialMinted event
    const iface = new ethers.Interface(CONTRACT_ABI.abi);
    let tokenId: string | null = null;

    for (const log of receipt.logs) {
      let parsed: ethers.LogDescription | null = null;
      try {
        parsed = iface.parseLog(log);
      } catch {
        parsed = null;
      }

      if (parsed && parsed.name === "CredentialMinted") {
        tokenId = parsed.args.tokenId.toString();
        break;
      }
    }

    if (tokenId) {
      setStatus(`✅ Credential minted! Token ID: ${tokenId}`);
      alert(`Credential minted!\nToken ID: ${tokenId}`);
    } else {
      setStatus("✅ Credential minted! (event not found)");
    }

    setLoading(false);
  } catch (err: any) {
    console.error("❌ Error:", err);
    const errorMessage = err?.reason || err?.message || "Unknown error";
    alert(`Operation failed: ${errorMessage}`);
    setStatus("❌ Operation failed");
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2027] via-[#050505] to-[#050505] text-white font-sans flex flex-col py-6">
      <Navbar />

      <div className="text-center mt-10">
        <h1 className="text-5xl font-bold mb-4">🎯 Mint New Credential</h1>
        <p className="text-white/60 text-lg">Mint student degrees as blockchain credentials NFT</p>

        {!address ? (
          <button
            onClick={connectWallet}
            className="mt-6 px-8 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <p className="mt-4 text-white/70">Wallet connected: {address}</p>
        )}
      </div>

      {address && (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto mt-10 bg-[#0F2027] p-10 rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all space-y-6"
        >
          <input
            type="text"
            placeholder="Degree Name"
            value={repoName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRepoName(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            required
            disabled={loading}
          />

          <textarea
            placeholder="Description"
            value={repoDesc}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRepoDesc(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            required
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Student ID / Major"
            value={repoTech}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRepoTech(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            disabled={loading}
          />

          <input
            type="text"
            placeholder="Year of Graduation"
            value={repoContributor}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRepoContributor(e.target.value)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            disabled={loading}
          />

          <input
            type="file"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRepoFile(e.target.files?.[0] || null)}
            className="w-full p-4 rounded-2xl bg-[#050505] border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            required
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-semibold text-lg ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            } transition-all`}
          >
            {loading ? "Minting..." : "Mint Credential"}
          </button>

          {status && <p className="text-center text-md mt-2 text-white/70">{status}</p>}
        </form>
      )}
    </div>
  );
}
