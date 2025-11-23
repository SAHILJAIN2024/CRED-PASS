"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "../../components/WalletContext";

type MetadataItem = {
  name?: string;
  title?: string;
  description?: string;
  image?: string;
  message?: string;
  attributes: { trait_type: string; value: string }[];
};

const Dashboard: React.FC = () => {
  const { address, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState<"repo" | "commit" | "badge">("repo");
  const [data, setData] = useState<MetadataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { key: "repo", label: "📁 Repositories" },
    { key: "commit", label: "💾 Commits" },
    { key: "badge", label: "🏅 Badges" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {

      const res = await fetch(`http://localhost:5000/api/repository${address}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();

      setData(result.items || []);
      setError(null);
    } catch (err) {
      console.error("Fetch failed", err);
      setError("⚠️ Failed to load data. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">🚀 Developer Dashboard</h1>
        
      {/* Loader */}
      {loading && (
        <div className="text-center text-gray-500 mt-8 animate-pulse">
          🔄 Loading...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center text-red-500 mt-8">{error}</div>
      )}

      {/* Empty State */}
      {!loading && !error && data.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No data found in this section.
        </div>
      )}

      {/* Grid Display */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 mt-8">
        {data.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white shadow-sm hover:shadow-md transition duration-200 p-4 space-y-2"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name || item.title || "NFT"}
                className="rounded-md h-40 w-full object-cover"
              />
            )}
            <h2 className="text-lg font-semibold text-gray-800 truncate">
              {item.name || item.title || "Untitled"}
            </h2>
            <p className="text-sm text-gray-600">
              {item.description || item.message || "No description"}
            </p>

            {/* Attribute Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.attributes.map((attr, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                >
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
