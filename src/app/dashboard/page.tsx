"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/src/components/navbar";
import { useWallet } from "../../components/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { Download, Share2, Award, Wallet } from "lucide-react";

// ---------- Types (Unchanged) ----------
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

// ---------- GraphQL (Unchanged) ----------
const GRAPH_URL =
  "https://api.studio.thegraph.com/query/117940/credpass/version/latest";

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

// ---------- IPFS Fetch (Unchanged) ----------
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
    const type = res.headers.get("content-type") || "";

    if (type.includes("application/json")) return await res.json();
    if (type.includes("text")) return await res.text();
    return await res.blob();
  } catch (err) {
    console.error("IPFS fetch error:", err, uri);
    return null;
  }
};

// ---------- Styled UI Components ----------

// The "Glass" Card Wrapper
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-6 flex flex-col transition-transform hover:scale-[1.02] duration-300 relative overflow-hidden group">
    {/* Subtle inner gradient hover effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative z-10 flex flex-col h-full">{children}</div>
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 border-b border-white/10 pb-4">{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-2xl font-light text-white tracking-wide">{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-white/60 mt-1 font-light">{children}</p>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-grow space-y-3">{children}</div>
);

const CardFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">{children}</div>
);

// The "Gradient Glow" Button
const Button = ({
  children,
  onClick,
  fullWidth = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`${
      fullWidth ? "w-full" : ""
    } px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2`}
  >
    {children}
  </button>
);

// ---------- Vault Card Component ----------
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

  const downloadFile = async () => {
    try {
      let fileUrl = metadata?.image || metadata?.file;

      if (!fileUrl) return alert("No downloadable file found");

      if (fileUrl.startsWith("ipfs://")) {
        fileUrl = fileUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      const res = await fetch(fileUrl);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title.replace(/\s+/g, "_");
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="p-2 bg-cyan-500/20 rounded-full border border-cyan-500/30">
            <Award className="h-6 w-6 text-cyan-300" />
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Info Rows */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex justify-between items-center">
            <span className="text-xs text-white/50 uppercase tracking-wider">Owner</span>
            <span className="text-sm text-cyan-300 font-mono truncate max-w-[150px]">
              {owner}
            </span>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex justify-between items-center">
            <span className="text-xs text-white/50 uppercase tracking-wider">Expiry</span>
            <span className="text-sm text-white/90">{expiry}</span>
          </div>
        </div>

        {/* Image Preview */}
        {metadata?.image && (
          <div className="relative mt-4 group overflow-hidden rounded-2xl border border-white/20">
            <img
              src={
                metadata.image.startsWith("ipfs://")
                  ? metadata.image.replace(
                      "ipfs://",
                      "https://ipfs.io/ipfs/"
                    )
                  : metadata.image
              }
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              alt="Credential"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Award className="text-white h-10 w-10 opacity-80" />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={downloadFile} fullWidth>
          <Download className="h-4 w-4" /> Download Credential
        </Button>
      </CardFooter>
    </Card>
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
    const load = async () => {
      if (!data || !address) return;

      const creds = data.credentialMinteds.filter(
        (c) => c.to.toLowerCase() === address.toLowerCase()
      );

      const map: any = {};
      await Promise.all(
        creds.map(async (c) => {
          if (c.uri) map[c.tokenId] = await fetchIPFS(c.uri);
        })
      );
      setMetadataMap(map);
    };

    load();
  }, [data, address]);

  return (
    <div className="min-h-screen relative text-white font-sans overflow-hidden">
      
      {/* 1. BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* 2. DARK GRADIENT OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />

      {/* 3. MAIN CONTENT */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />

        <div className="max-w-7xl mx-auto w-full mt-20 px-6 pb-20">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extralight tracking-tight mb-4">
              My Vault
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
              Your verified academic credentials, secured forever on-chain.
            </p>
          </div>

          {/* Logic: Wallet Not Connected */}
          {!address && (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 mx-auto max-w-2xl">
              <Wallet className="w-16 h-16 text-white/40 mb-6" />
              <h2 className="text-2xl font-light mb-8">Please connect your wallet to view credentials</h2>
              <button
                onClick={connectWallet}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold text-xl shadow-lg shadow-purple-900/40 transition-all"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* Logic: Loading / Error */}
          {isLoading && (
            <div className="flex justify-center mt-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          )}
          
          {isError && (
            <div className="text-center p-10 bg-red-500/20 border border-red-500/50 rounded-2xl">
              <p className="text-red-200 text-lg">Failed to retrieve credentials from the blockchain.</p>
            </div>
          )}

          {/* Logic: Display Data */}
          {address && data && !isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.credentialMinteds
                .filter(
                  (c) => c.to.toLowerCase() === address.toLowerCase()
                )
                .map((c) => (
                  <VaultCard
                    key={c.tokenId}
                    tokenId={c.tokenId}
                    owner={c.to}
                    expiry={new Date(
                      Number(c.expiryTs) * 1000
                    ).toLocaleDateString()}
                    metadata={metadataMap[c.tokenId]}
                  />
                ))}
            </div>
          )}
          
          {/* Empty State */}
          {address && data && !isLoading && data.credentialMinteds.filter(c => c.to.toLowerCase() === address.toLowerCase()).length === 0 && (
             <div className="text-center py-20">
                <p className="text-white/50 text-xl font-light">No credentials found in this vault.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;