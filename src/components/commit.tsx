"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import VotingABI from "../contractABI/votingABI.json";
import { 
  Vote, 
  Send, 
  ShieldCheck, 
  RefreshCw, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Wallet,
  Settings
} from "lucide-react";

// ---------------- Types ----------------
type VerificationItem = {
  id: string;
  projectId?: string;
  proposer?: string;
  proofURI?: string;
  finalized?: boolean;
  approved?: boolean;
};

type ResultShape = {
  finalized: boolean;
  approved: boolean;
  nftId: string | null;
} | null;

const DAO_CONTRACT_ADDRESS = "0xDbaB155e9FCa739e9Bea2571b6a43933a3117e45";

// ---------------- Styled Components ----------------
const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 ${className}`}>
    {children}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 text-lg transition-colors"
  />
);

const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full p-4 rounded-2xl bg-black/40 border border-white/20 text-white focus:outline-none focus:border-cyan-400 text-lg appearance-none cursor-pointer"
  >
    {props.children}
  </select>
);

const ActionButton = ({ 
  children, 
  onClick, 
  disabled, 
  loading,
  variant = "primary" 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  disabled?: boolean; 
  loading?: boolean;
  variant?: "primary" | "secondary" | "success";
}) => {
  const baseStyle = "w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg shadow-purple-900/40 text-white",
    secondary: "bg-white/5 border border-white/20 hover:bg-white/10 text-white",
    success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 shadow-lg shadow-emerald-900/40 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : children}
    </button>
  );
};

export default function VerificationApp(): React.ReactElement {
  // ---------------- State ----------------
  const [account, setAccount] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [proofURI, setProofURI] = useState<string>("");
  const [verificationId, setVerificationId] = useState<string>("");
  const [voteChoice, setVoteChoice] = useState<boolean>(true);
  const [result, setResult] = useState<ResultShape>(null);
  const [status, setStatus] = useState<string>("");
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [tab, setTab] = useState<"submit" | "vote" | "admin">("submit");
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [currentElection, setCurrentElection] = useState<number | null>(null);
  const [hasVoteToken, setHasVoteToken] = useState<boolean>(false);

  // ---------------- Provider Helpers ----------------
  const getProvider = async (): Promise<ethers.BrowserProvider> => {
    if (!(window as any).ethereum) throw new Error("Wallet not found");
    return new ethers.BrowserProvider((window as any).ethereum);
  };

  const getSigner = async (): Promise<ethers.JsonRpcSigner> => {
    const provider = await getProvider();
    return provider.getSigner();
  };

  const getContract = async (): Promise<ethers.Contract> => {
    const signer = await getSigner();
    return new ethers.Contract(DAO_CONTRACT_ADDRESS, VotingABI as any, signer);
  };

  // ---------------- Wallet Connect ----------------
  const connectWallet = async () => {
    try {
      const provider = await getProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const acct = accounts?.[0] ?? null;
      setAccount(acct);

      if (acct) {
        await fetchVotingTokenStatus(acct);
        await fetchVerifications();
      }

      setStatus("Connected to " + acct);
    } catch (err: any) {
      setStatus("❌ " + err.message);
    }
  };

  // ---------------- Logic Functions ----------------
  const fetchVotingTokenStatus = async (acct: string) => {
    try {
      const contract = await getContract();
      const electionIdRaw = await contract.currentElectionId();
      const electionId = Number(electionIdRaw);
      setCurrentElection(electionId);

      const balance = await contract.balances(electionIdRaw, acct);
      setHasVoteToken(balance.toString() === "1");
    } catch {
      setStatus("❌ Error fetching token status");
    }
  };

  const fetchVerifications = async () => {
    try {
      const contract = await getContract();
      if ((contract as any).getAllVerifications) {
        const raw = await (contract as any).getAllVerifications();
        const parsed = raw.map((r: any) => ({
          id: r?.id?.toString() ?? "",
          projectId: r?.projectId,
          proposer: r?.proposer,
          proofURI: r?.proofURI,
          finalized: Boolean(r?.finalized),
          approved: Boolean(r?.approved),
        }));
        setVerifications(parsed.reverse());
      }
    } catch {
      setStatus("❌ Failed to fetch verifications");
    }
  };

  const submitVerification = async () => {
    try {
      setLoadingTx(true);
      const contract = await getContract();
      const tx = await contract.submitVerification(projectId, proofURI);
      await tx.wait();
      setStatus("✅ Submitted");
      setProjectId("");
      setProofURI("");
      fetchVerifications();
    } catch (err: any) {
      setStatus("❌ " + err.message);
    } finally {
      setLoadingTx(false);
    }
  };

  const voteVerification = async () => {
    if (!hasVoteToken) return setStatus("❌ No voting token");

    try {
      setLoadingTx(true);
      const contract = await getContract();
      const tx = await contract.vote(verificationId, voteChoice);
      await tx.wait();
      setStatus("✅ Vote casted");
      fetchVerifications();
    } catch (err: any) {
      setStatus("❌ " + err.message);
    } finally {
      setLoadingTx(false);
    }
  };

  const finalizeVerification = async () => {
    try {
      setLoadingTx(true);
      const contract = await getContract();
      const tx = await contract.finalize(verificationId);
      await tx.wait();
      setStatus("✅ Finalized");
      fetchVerifications();
    } catch (err: any) {
      setStatus("❌ " + err.message);
    } finally {
      setLoadingTx(false);
    }
  };

  const getResult = async () => {
    try {
      const contract = await getContract();
      const res = await contract.getResult(verificationId);
      setResult({
        finalized: Boolean(res.finalized),
        approved: Boolean(res.approved),
        nftId: res.nftId?.toString() ?? null,
      });
    } catch {
      setStatus("❌ Failed to fetch result");
    }
  };

  useEffect(() => {
    if (!account) return;
    fetchVotingTokenStatus(account);
    fetchVerifications();
  }, [account]);

  // ---------------- UI ----------------
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

      {/* 2. DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />

      {/* 3. CONTENT WRAPPER */}
      <div className="relative z-10 min-h-screen p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-center md:text-left">
                Verification DAO
              </h1>
              <p className="text-white/60 mt-2 text-lg font-light text-center md:text-left">
                Decentralized Governance & On-Chain Consensus
              </p>
            </div>

            {account ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl flex flex-col items-end">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                   <span className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"/> 
                   Connected
                </div>
                <div className="font-mono text-sm text-white/80 mt-1">{account.substring(0, 6)}...{account.substring(account.length - 4)}</div>
                <div className="text-xs text-white/50 mt-1">
                  Election #{currentElection ?? "-"} •{" "}
                  {hasVoteToken ? (
                    <span className="text-emerald-400">Voting Eligible</span>
                  ) : (
                    <span className="text-red-400">No Token</span>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold text-lg shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2"
              >
                <Wallet className="w-5 h-5"/> Connect Wallet
              </button>
            )}
          </header>

          {/* Navigation Tabs */}
          <div className="flex justify-center md:justify-start gap-4">
            {[
              { id: "submit", label: "Submit", icon: Send },
              { id: "vote", label: "Vote", icon: Vote },
              { id: "admin", label: "Admin Panel", icon: Settings },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-8 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                  tab === t.id
                    ? "bg-white text-black font-semibold shadow-xl shadow-white/10 scale-105"
                    : "bg-black/30 text-white/60 hover:bg-black/50 hover:text-white border border-white/10"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: MAIN ACTION */}
            <div className="lg:col-span-2">
              
              {/* TAB: SUBMIT */}
              {tab === "submit" && (
                <GlassCard className="min-h-[400px] flex flex-col justify-center">
                  <h2 className="text-3xl font-light mb-8 flex items-center gap-3">
                    <Send className="text-cyan-400" /> Submit Proposal
                  </h2>
                  <div className="space-y-6">
                    <StyledInput
                      placeholder="Institute / Project Name"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                    />
                    <StyledInput
                      placeholder="Proof URI (IPFS Hash)"
                      value={proofURI}
                      onChange={(e) => setProofURI(e.target.value)}
                    />
                    <ActionButton 
                      onClick={submitVerification} 
                      disabled={!account} 
                      loading={loadingTx}
                    >
                      {loadingTx ? "Submitting..." : "Submit Verification"}
                    </ActionButton>
                  </div>
                </GlassCard>
              )}

              {/* TAB: VOTE */}
              {tab === "vote" && (
                <GlassCard className="min-h-[400px]">
                  <h2 className="text-3xl font-light mb-8 flex items-center gap-3">
                    <Vote className="text-purple-400" /> Cast Your Vote
                  </h2>
                  <div className="space-y-6">
                    <StyledInput
                      placeholder="Verification ID"
                      value={verificationId}
                      onChange={(e) => setVerificationId(e.target.value)}
                    />
                    
                    <div className="relative">
                      <StyledSelect
                        value={voteChoice ? "yes" : "no"}
                        onChange={(e) => setVoteChoice(e.target.value === "yes")}
                      >
                        <option value="yes" className="bg-slate-900">Approve Proposal</option>
                        <option value="no" className="bg-slate-900">Reject Proposal</option>
                      </StyledSelect>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                        ▼
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ActionButton 
                        onClick={voteVerification} 
                        disabled={!account} 
                        loading={loadingTx}
                      >
                         Submit Vote
                      </ActionButton>
                      <ActionButton 
                        variant="secondary"
                        onClick={getResult}
                      >
                        Check Result
                      </ActionButton>
                    </div>

                    {/* Result Display */}
                    {result && (
                      <div className="mt-6 p-6 bg-black/40 rounded-2xl border border-white/10 animate-fade-in">
                        <h4 className="text-white/60 text-sm uppercase tracking-widest mb-4">Live Results</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">Status:</span>
                          <span className={result.finalized ? "text-emerald-400" : "text-amber-400"}>
                            {result.finalized ? "Finalized" : "Ongoing"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">Outcome:</span>
                          {result.approved ? (
                             <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Approved</span>
                          ) : (
                             <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4"/> Rejected</span>
                          )}
                        </div>
                        {result.nftId && (
                           <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                             <span className="text-white/60">Minted NFT ID:</span>
                             <span className="font-mono text-cyan-300">{result.nftId}</span>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}

              {/* TAB: ADMIN */}
              {tab === "admin" && (
                <GlassCard>
                  <h2 className="text-3xl font-light mb-8 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400" /> Admin Controls
                  </h2>

                  {/* Finalize Section */}
                  <div className="p-6 bg-black/20 rounded-2xl border border-white/10 mb-8">
                    <h3 className="text-lg font-medium mb-4">Finalize Election</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <StyledInput
                        placeholder="Verification ID to Finalize"
                        value={verificationId}
                        onChange={(e) => setVerificationId(e.target.value)}
                      />
                      <div className="md:w-1/3">
                        <ActionButton 
                          variant="success"
                          onClick={finalizeVerification} 
                          disabled={!account} 
                          loading={loadingTx}
                        >
                          Finalize
                        </ActionButton>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-4 text-white/80">Recent Submissions</h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {verifications.map((v) => (
                      <div
                        key={v.id}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-md border border-cyan-500/30">ID #{v.id}</span>
                              <h4 className="font-semibold text-lg">{v.projectId}</h4>
                            </div>
                            <p className="text-xs text-white/50 font-mono truncate max-w-[250px]">
                              Proposer: {v.proposer}
                            </p>
                          </div>
                          <div className="text-right">
                             {v.finalized ? (
                               <span className="text-emerald-400 text-xs flex items-center gap-1 justify-end"><CheckCircle className="w-3 h-3"/> Finalized</span>
                             ) : (
                               <span className="text-amber-400 text-xs flex items-center gap-1 justify-end"><Activity className="w-3 h-3"/> Active</span>
                             )}
                             <div className="mt-1 text-xs text-white/40">
                               {v.approved ? "Votes: Approved" : "Votes: Pending/Rejected"}
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {verifications.length === 0 && (
                      <p className="text-center text-white/40 py-8">No submissions found on-chain.</p>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* RIGHT COLUMN: SIDEBAR */}
            <aside className="space-y-6">
              <GlassCard>
                <h4 className="text-xl font-light mb-6 border-b border-white/10 pb-4">
                  Quick Actions
                </h4>

                <div className="space-y-4">
                  <button
                    onClick={fetchVerifications}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center gap-3 text-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-400" /> Refresh Data
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition flex items-center gap-3 text-sm"
                  >
                    <Activity className="w-4 h-4 text-purple-400" /> Force Reload
                  </button>
                </div>
              </GlassCard>

              <GlassCard>
                <h4 className="text-xl font-light mb-6 border-b border-white/10 pb-4">
                  System Status
                </h4>
                <div className="bg-black/40 p-4 rounded-xl border border-white/10 min-h-[80px] flex items-center justify-center text-center">
                  <p className={`text-sm ${status.includes("❌") ? "text-red-400" : "text-emerald-400"}`}>
                    {status || "System Ready. Waiting for interaction."}
                  </p>
                </div>
              </GlassCard>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}