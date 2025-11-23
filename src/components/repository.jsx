"use client";
import React, { useState } from "react";

export default function Repository({ contract, currentAccount }) {
  const [repoName, setRepoName] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoTech, setRepoTech] = useState("");
  const [repoContributor, setRepoContributor] = useState("");
  const [repoFile, setRepoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentAccount) {
      alert("⚠️ Please connect your wallet first");
      return;
    }
    if (!repoFile) {
      alert("⚠️ Please select a file to upload");
      return;
    }

    setLoading(true);
    setStatus("Uploading to IPFS...");

    try {
      // Step 1: Upload metadata + file to backend → IPFS
      const formData = new FormData();
      formData.append("to", currentAccount);
      formData.append("name", repoName);
      formData.append("desc", repoDesc);
      formData.append("tech", repoTech);
      formData.append("contributor", repoContributor);
      formData.append("file", repoFile);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/mint/repo`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Backend upload failed");
      const data = await res.json();

      console.log("✅ Metadata URI:", data.metadataUri);

      // Step 2: Mint NFT on-chain using user's wallet
      setStatus("Minting on blockchain...");
      const tx = await contract.mintRepo(currentAccount, data.metadataUri);
      await tx.wait();

      console.log("🎉 Repository minted:", tx.hash);
      setStatus("✅ Repository minted successfully!");
      alert(`Repository minted!\nTx Hash: ${tx.hash}`);
    } catch (err) {
      console.error("❌ Error minting repository:", err);
      const errorMessage = err?.reason || err?.message || "Unknown error";
      alert(`Minting failed: ${errorMessage}`);
      setStatus("❌ Minting failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto mt-10 bg-white shadow-md p-6 rounded-xl border border-gray-200"
    >
      <input
        type="text"
        placeholder="Repository Name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
        className="border p-2 m-2 w-full"
        required
        disabled={loading}
      />
      <textarea
        placeholder="Description"
        value={repoDesc}
        onChange={(e) => setRepoDesc(e.target.value)}
        className="border p-2 m-2 w-full"
        required
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Tech Used"
        value={repoTech}
        onChange={(e) => setRepoTech(e.target.value)}
        className="border p-2 m-2 w-full"
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Contributor"
        value={repoContributor}
        onChange={(e) => setRepoContributor(e.target.value)}
        className="border p-2 m-2 w-full"
        disabled={loading}
      />
      <input
        type="file"
        onChange={(e) => setRepoFile(e.target.files[0])}
        className="border p-2 m-2 w-full"
        required
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className={`p-2 m-2 w-full text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
        }`}
      >
        {loading ? "Minting..." : "Create Repository"}
      </button>

      {status && <p className="text-center text-sm mt-2">{status}</p>}
    </form>
  );
}

export { Repository };
