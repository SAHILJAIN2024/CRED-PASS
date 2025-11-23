"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/src/components/navbar";
import { useWallet } from "../../components/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

// ---------- Types ----------
type CredentialMinted = {
  tokenId: string;
  to: string;
  uri: string;
  expiryTs: string;
  metadata?: any;
};

type GraphResponse = {
  credentialMinteds: CredentialMinted[];
};

// ---------- GraphQL ----------
const GRAPH_URL = "https://api.studio.thegraph.com/query/117940/cred-pass/version/latest";

const QUERY = gql`
{
  credentialMinteds(first: 50, orderBy: tokenId, orderDirection: desc) {
    tokenId
    to
    uri
    expiryTs
  }
}
`;

// ---------- IPFS Fetch ----------
const fetchIPFS = async (uri: string) => {
  if (!uri) return null;
  const url = uri.startsWith("ipfs://")
    ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
    : uri.startsWith("http")
    ? uri
    : `https://gateway.pinata.cloud/ipfs/${uri}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`IPFS fetch failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return await res.json();
    if (contentType.includes("text")) return await res.text();
    return await res.blob();
  } catch (err) {
    console.error("IPFS fetch error:", err, uri);
    return null;
  }
};

// ---------- Vault Card ----------
const VaultCard = ({
  tokenId,
  owner,
  expiry,
  metadata,
}: {
  tokenId: string;
  owner: string;
  expiry: string;
  metadata: any;
}) => {
  const title = metadata?.name || `Credential #${tokenId}`;
  const description = metadata?.description || "No description available";

  return (
    <div className="bg-[#0F2027] p-6 rounded-3xl border border-white/10 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between">
      <div>
        <h3 className="text-2xl font-bold text-purple-400 mb-3">{title}</h3>
        <p className="text-white/60 text-sm mb-3">{description}</p>
        <p className="text-white/40 text-xs">
          Owner: {owner} <br /> Expiry: {expiry}
        </p>
      </div>

      {metadata && metadata.image && (
        <img
          src={metadata.image.startsWith("ipfs://") ? metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/") : metadata.image}
          alt={title}
          className="w-full h-40 object-contain rounded-xl mt-4"
        />
      )}
    </div>
  );
};

// ---------- Dashboard ----------
const Dashboard = () => {
  const { address, connectWallet } = useWallet();
  const [metadataMap, setMetadataMap] = useState<Record<string, any>>({});

  const { data, isLoading, isError } = useQuery<GraphResponse>({
    queryKey: ["credentials", address],
    queryFn: async () => request(GRAPH_URL, QUERY),
    enabled: !!address,
  });

  useEffect(() => {
    const loadMetadata = async () => {
      if (!data || !address) return;
      const userCreds = (data.credentialMinteds || []).filter(
        (c) => c.to.toLowerCase() === address.toLowerCase()
      );

      const map: Record<string, any> = {};
      await Promise.all(
        userCreds.map(async (c) => {
          if (c.uri) map[c.tokenId] = await fetchIPFS(c.uri);
        })
      );

      setMetadataMap(map);
    };

    loadMetadata();
  }, [data, address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F2027] via-[#050505] to-[#050505] text-white font-sans flex flex-col py-6">
      <Navbar />

      <div className="flex-grow flex flex-col items-center px-6 text-center">
        <h1 className="text-4xl font-bold mb-10">🎓 My Vault</h1>

        {!address && (
          <button
            onClick={connectWallet}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl shadow-lg mb-10"
          >
            Connect Wallet
          </button>
        )}

        {isLoading && <div className="text-gray-400 mt-4">Loading data...</div>}
        {isError && <div className="text-red-400 mt-4">Error fetching data</div>}

        {address && !isLoading && !isError && (
          <>
            {data?.credentialMinteds?.some((c) => c.to.toLowerCase() === address.toLowerCase()) ? (
              <div className="w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.credentialMinteds
                  .filter((c) => c.to.toLowerCase() === address.toLowerCase())
                  .map((c) => (
                    <VaultCard
                      key={c.tokenId}
                      tokenId={c.tokenId}
                      owner={c.to}
                      expiry={new Date(Number(c.expiryTs) * 1000).toLocaleDateString()}
                      metadata={metadataMap[c.tokenId]}
                    />
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 mt-4">No credentials found</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
