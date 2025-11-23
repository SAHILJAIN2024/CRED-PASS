"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/src/components/WalletContext";
import CONTRACT_ABI from "@/src/contractABI/contractABI.json";

// Define props for Fork component
type ForkProps = {
  repoId: string;
  repoName: string;
  owner: string;
  description?: string;
  tags?: string[];
  files?: any[];
  commits?: any[];
  prevDataUri?: string;
  onClose?: () => void;
};

export default function Fork({
  repoId,
  repoName,
  owner,
  description,
  tags,
  files,
  commits,
  prevDataUri,
  onClose,
}: ForkProps) {
  const { address } = useWallet();
  const [contributor, setContributor] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  // repo data fetched from backend
  const [repoData, setRepoData] = useState<any>(null);
  const [metadataUri, setMetadataUri] = useState<string>("");

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
        console.log("✅ Fork contract initialized");
      } catch (err) {
        console.error("❌ Error initializing contract:", err);
      }
    };

    initContract();
  }, [address]);

  // ✅ Fetch repository details for the connected wallet
  useEffect(() => {
    if (!address) return;

    const fetchRepoData = async () => {
      try {
        setStatus("Fetching repository details...");
        const res = await fetch(`http://localhost:5000/api/repo/${address}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch repo data");

        setRepoData(data);
        console.log("✅ Repo data loaded:", data);
        setStatus("");
      } catch (err: any) {
        console.error("❌ Repo fetch failed:", err);
        setStatus(`⚠️ Failed to fetch repo: ${err.message}`);
      }
    };

    fetchRepoData();
  }, [address]);

  // ✅ Handle Fork Commit Minting
  const handleFork = async () => {
    if (!address) return alert("⚠️ Connect your wallet first");
    if (!contributor || !message || !file || !repoData) {
      setStatus("⚠️ All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing fork metadata...");

      // --- Fork Metadata Payload ---
      const forkPayload = {
        originalRepoId: repoData.repoID,
        originalRepoName: repoData.repoName,
        originalOwner: repoData.owner,
        originalDescription: repoData.description || "",
        originalTags: repoData.tags || [],
        originalCommits: repoData.commits || [],
        originalFiles: repoData.files || [],
        originalPrevDataUri: repoData.prevDataUri,

        newForkOwner: address,
        contributor: contributor,
        forkTimestamp: new Date().toISOString(),
        forkMessage: message,
      };

      console.log("📦 Fork Payload to Backend:", forkPayload);

      // --- Send to Backend (No direct IPFS upload here) ---
      const formData = new FormData();
      formData.append("forkData", JSON.stringify(forkPayload));
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/fork", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Fork creation failed");

      setMetadataUri(data.metadataUri);
      setStatus("Minting fork on blockchain...");

      // --- Mint Fork On-Chain ---
      if (!contract) return alert("⚠️ Contract not initialized yet");

      const repoIdNum = Number(repoData.repoID);
      if (isNaN(repoIdNum)) throw new Error("Invalid Repository ID");

      const tx = await contract.mintCommit(repoIdNum, data.metadataUri);
      await tx.wait();

      setStatus("✅ Fork minted successfully!");
      alert(`✅ Fork created!\nTx Hash: ${tx.hash}`);

      setContributor("");
      setMessage("");
      setFile(null);
      (document.querySelector('input[type="file"]') as HTMLInputElement).value = "";
    } catch (err: any) {
      console.error("❌ Error:", err);
      const msg = err?.reason || err?.message || "Unknown error";
      setStatus(`❌ Fork failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="p-4 bg-gray-900 rounded-md border border-purple-600 mt-2">
      <h3 className="text-lg font-semibold mb-2">Fork: {repoName}</h3>
      <p className="text-gray-400 mb-2">Original Owner: {owner}</p>
      <p className="text-gray-400 mb-2">{description}</p>

      <input
        type="text"
        placeholder="Contributor name"
        value={contributor}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setContributor(e.target.value)}
        className="border p-2 rounded w-full mb-2 bg-black text-white"
      />
      <input
        type="text"
        placeholder="Fork message"
        value={message}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
        className="border p-2 rounded w-full mb-2 bg-black text-white"
      />
      <input
        type="file"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
        className="border p-2 rounded w-full mb-2 bg-black text-white"
      />

      <div className="flex justify-end gap-2 mt-2">
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
          >
            Cancel
          </button>
        )}
        <button
          className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded"
          onClick={() => {
            // call your fork submit function here
            console.log("Fork submitted for repo:", repoId);
          }}
        >
          Fork Repo
        </button>
      </div>

      {status && <p className="mt-2 text-sm text-gray-300">{status}</p>}
    </div>
  );
}

