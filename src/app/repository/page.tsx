"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { ethers } from "ethers";
import CONTRACT_ABI from "@/src/contractABI/contractABI.json";
import Navbar from "@/src/components/navbar_home";
import VerificationApp from "@/src/components/commit";

// Address + Types
interface RepoMetadata {
  metadataUri: string;
}
const CONTRACT_ADDRESS = "0x25b3ebF0baFeF6Db784E8E02A80aBa96686bcd30";

export default function Repository() {
  const [address, setAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isIssuer, setIsIssuer] = useState<boolean>(false);

  const [recipient, setRecipient] = useState<string>("");

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
      const [account] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(account);
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  };

  // Initialize contract and check role
  useEffect(() => {
    if (!address) return;

    const setupContract = async () => {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI.abi,
          signer
        );

        setContract(contractInstance);

        const roleBytes: string = await contractInstance.ISSUER_ROLE();
        const issuer: boolean = await contractInstance.hasRole(
          roleBytes,
          address
        );

        setIsIssuer(issuer);
      } catch (err) {
        console.error("❌ Error initializing contract:", err);
      }
    };

    setupContract();
  }, [address]);

  // Submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address) return alert("⚠️ Connect your wallet first");
    if (!contract) return alert("⚠️ Contract not ready");
    if (!isIssuer) return alert("⚠️ Unauthorized");
    if (!repoFile) return alert("⚠️ Select a file");

    if (!ethers.isAddress(recipient)) {
      return alert("❌ Invalid wallet address");
    }

    setLoading(true);
    setStatus("Uploading to IPFS...");

    try {
      const formData = new FormData();
      formData.append("ownerAddress", recipient);
      formData.append("name", repoName);
      formData.append("description", repoDesc);
      formData.append("tech", repoTech);
      formData.append("contributor", repoContributor);
      formData.append("file", repoFile);

      const res = await fetch("http://localhost:5000/api/repo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend upload failed");

      const data: RepoMetadata = await res.json();
      setStatus("Minting on blockchain...");

      const expiryTs = BigInt(
        Math.floor(Date.now() / 1000) + 365 * 24 * 3600
      );
      const createTBA = true;

      const tx = await contract.mintCred(
        recipient,
        data.metadataUri,
        expiryTs,
        createTBA,
        {
          gasLimit: 500_000,
        }
      );

      setStatus("Waiting for confirmation...");
      const receipt = await tx.wait();
      if (!receipt) throw new Error("Transaction failed");

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
        setStatus(`✅ Success! Token ID: ${tokenId}`);
        alert(`Minted! Token ID: ${tokenId}`);
      } else {
        setStatus("Minted (event not found)");
      }

      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error:", err);
      alert(err?.reason || err?.message || "Unknown error");
      setStatus("❌ Failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative text-white font-sans overflow-hidden">

      {/* BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* DARK GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />

        <div className="max-w-5xl mx-auto w-full mt-20 px-6">
          {/* Header Title */}
          <h1 className="text-5xl md:text-6xl font-extralight text-center">
            Institute Dashboard
          </h1>
          <p className="text-center text-white/70 mt-3 text-lg">
            Mint official student credentials securely on-chain
          </p>

          {/* Connect Wallet */}
          <div className="flex justify-center mt-8">
            {!address ? (
              <button
                onClick={connectWallet}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold text-xl shadow-lg shadow-purple-900/40 transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <p className="text-white/80">
                Connected: <span className="text-cyan-300">{address}</span>
              </p>
            )}
          </div>

          {/* FORM CARD */}
          {address && (
            <form
              onSubmit={handleSubmit}
              className="mt-12 bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-2xl space-y-6"
            >
              <h2 className="text-3xl font-light mb-4 text-center">
                Issue New Credential
              </h2>

              {/* Inputs */}
              <input
                type="text"
                placeholder="Recipient Wallet Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-lg"
                required
                disabled={loading}
              />

              <input
                type="text"
                placeholder="Degree Name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 text-lg"
                required
                disabled={loading}
              />

              <textarea
                placeholder="Description"
                value={repoDesc}
                onChange={(e) => setRepoDesc(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 text-lg"
                required
                disabled={loading}
              />

              <input
                type="text"
                placeholder="Student ID / Major"
                value={repoTech}
                onChange={(e) => setRepoTech(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 text-lg"
                disabled={loading}
              />

              <input
                type="text"
                placeholder="Year of Graduation"
                value={repoContributor}
                onChange={(e) => setRepoContributor(e.target.value)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 text-lg"
                disabled={loading}
              />

              <input
                type="file"
                onChange={(e) => setRepoFile(e.target.files?.[0] || null)}
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:border-cyan-400 text-lg"
                required
                disabled={loading}
              />

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl text-white font-semibold text-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg shadow-purple-900/40 transition-all ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Minting..." : "Mint Credential"}
              </button>

              {/* Status */}
              {status && (
                <p className="text-center text-white/70 mt-2 text-lg">{status}</p>
              )}
            </form>
          )}

          
        </div>
      </div>
    </div>
  );
}
