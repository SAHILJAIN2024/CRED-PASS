"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/components/WalletContext";
import CONTRACT_ABI from "@/contractABI/contractABI.json";

export default function Commit() {
  const { address } = useWallet(); // 👈 Auto fetch connected wallet
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contributor, setContributor] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [metadataUri, setMetadataUri] = useState<string>("");
  const [repoID, setRepoID] = useState<string>("");

  // ✅ Initialize contract when wallet connects
  useEffect(() => {
    if (!address) return;

    const initContract = async () => {
      try {
        const contractAddress = "0xc6F7B0E1265b8D3201F20fC3EE832654D1a21850";
        if (!(window as any).ethereum) {
          alert("⚠️ Please install MetaMask!");
          return;
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddress,
          CONTRACT_ABI.abi,
          signer
        );
        setContract(contractInstance);
        console.log("✅ Commit contract initialized");
      } catch (err) {
        console.error("❌ Error initializing contract:", err);
      }
    };

    initContract();
  }, [address]);

  // ✅ Handle Commit Minting
  const mintCommit = async () => {
  if (!address) return alert("⚠️ Connect your wallet first");
  if (!contributor || !message || !file || !repoID) {
    setStatus("⚠️ All fields are required.");
    return;
  }

  try {
    setLoading(true);
    setStatus("Uploading commit to IPFS...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message);
    formData.append("ownerAddress", address);
    formData.append("contributor", contributor);

    const response = await fetch("http://localhost:5000/api/commit", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "IPFS upload failed");

    setMetadataUri(data.metadataUri);
    setStatus("Minting commit on blockchain...");

    if (!contract) return alert("⚠️ Contract not initialized yet");

    const repoIdNum = Number(repoID);
    if (isNaN(repoIdNum)) throw new Error("Invalid Repository ID");

    // ✅ Correct contract call
    const tx = await contract.mintCommit(repoIdNum, data.metadataUri);
    await tx.wait();

    setStatus("✅ Commit minted successfully!");
    alert(`Commit minted!\nTx Hash: ${tx.hash}`);

    // Clear fields
    setContributor("");
    setMessage("");
    setFile(null);
    (document.querySelector('input[type=\"file\"]') as HTMLInputElement).value = "";
  } catch (err: any) {
    console.error("❌ Error:", err);
    const msg = err?.reason || err?.message || "Unknown error";
    setStatus(`❌ Minting failed: ${msg}`);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="max-w-md mx-auto mt-10 bg-[#0A0A0A] shadow-[0_0_20px_#9D00FF] p-6 rounded-xl border border-gray-700 text-white">
      <h2 className="text-xl font-semibold mb-4 text-center">📝 Commit to Repository</h2>

      <div className="flex flex-col gap-3">
        <div className="text-sm text-gray-300">
          <p><strong>Connected Wallet:</strong> {address || "Not connected"}</p>
        </div>

        <input
          type="text"
          placeholder="Repository ID"
          value={repoID}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRepoID(e.target.value)}
          className="border border-gray-600 bg-black text-white p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Commit message"
          value={message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          className="border border-gray-600 bg-black text-white p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Contributor name or address"
          value={contributor}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setContributor(e.target.value)}
          className="border border-gray-600 bg-black text-white p-2 rounded"
          required
        />

        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFile(e.target.files?.[0] || null)
          }
          className="border border-gray-600 bg-black text-white p-2 rounded"
        />
        {file && <p className="text-sm text-gray-400">📁 {file.name}</p>}

        <button
          onClick={mintCommit}
          disabled={loading}
          className={`w-full mt-4 py-2 rounded text-white ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Minting..." : "Mint Commit"}
        </button>

        {status && <p className="mt-3 text-center text-sm">{status}</p>}
        {metadataUri && (
          <p className="mt-2 text-center text-blue-400 underline text-sm">
            <a href={metadataUri} target="_blank" rel="noopener noreferrer">
              🌐 View IPFS Metadata
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
