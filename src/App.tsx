/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Check, Filter, Search, Award, Sparkles, AlertTriangle, 
  Code, Send, HelpCircle, FileText, ArrowUpRight, Cpu, 
  Activity, Users, Coins, RefreshCw, Layers, ShieldCheck, 
  Terminal, ArrowRight, CheckCircle2, XCircle, Heart, Info, ExternalLink, Download
} from 'lucide-react';
import { Task, ProofSubmission, StacksTransaction, StacksBlock, LeaderboardEntry, WebSdkAction } from './types';
import WalletWidget from './components/WalletWidget';
import ActivityHub from './components/ActivityHub';
import { clarityContractCode } from './data/clarityContract';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'submissions' | 'sdk' | 'contract'>('dashboard');

  // Simulated Blockchain States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [blocks, setBlocks] = useState<StacksBlock[]>([]);
  const [transactions, setTransactions] = useState<StacksTransaction[]>([]);
  const [balances, setBalances] = useState<Record<string, { address: string; stx: number; poa: number; label: string }>>({});
  const [blockHeight, setBlockHeight] = useState<number>(0);
  const [btcHeight, setBtcHeight] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Selected wallet address
  const [currentAddress, setCurrentAddress] = useState<string>('ST1NX0...DEV101');

  // Loading indicator flags
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);

  // SDK Code Sandbox Output state
  const [sdkLogs, setSdkLogs] = useState<string[]>([
    '// ProofStack SDK initialized successfully',
    '// Waiting for an action to simulate on-chain telemetry...'
  ]);
  const [sdkRunningAction, setSdkRunningAction] = useState<string | null>(null);

  // Trigger loading state initially
  useEffect(() => {
    fetchChainState();
  }, []);

  const fetchChainState = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, tasksRes, subRes, txsRes, lbRes] = await Promise.all([
        fetch('/api/blockchain/status'),
        fetch('/api/tasks'),
        fetch('/api/proofs'),
        fetch('/api/blockchain/transactions'),
        fetch('/api/leaderboard')
      ]);

      const statusData = await statusRes.json();
      const tasksData = await tasksRes.json();
      const subData = await subRes.json();
      const txsData = await txsRes.json();
      const lbData = await lbRes.json();

      setBlockHeight(statusData.blockHeight);
      setBtcHeight(statusData.btcHeight);
      setBalances(statusData.balances);
      setTasks(tasksData.tasks);
      setSubmissions(subData.submissions);
      setTransactions(txsData.transactions);
      setLeaderboard(lbData.leaderboard);
    } catch (e) {
      console.error('Failed to sync chain state:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sponsor Task On-chain action
  const handleAddTask = async (taskData: {
    title: string;
    description: string;
    rewardPoa: number;
    requiredProofType: 'github_pr' | 'code_url' | 'smart_contract' | 'other';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    creator: string;
  }) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit transaction');
        return;
      }
      
      // Update local state log message in SDK if they are looking
      addSdkLog(`Broadcast: contract-call::(create-task "${taskData.title.slice(0, 30)}...") called by ${taskData.creator}. Escrow secured.`);
      
      await fetchChainState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Submit Proof of Completion action
  const handleSubmitProof = async (proofData: {
    taskId: string;
    submitterAddress: string;
    proofUrl: string;
    proofDetails: string;
  }) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit proof');
        return;
      }

      addSdkLog(`Broadcast: contract-call::(submit-proof) target Task id "${proofData.taskId}" submitted. Proof URI: "${proofData.proofUrl}".`);

      await fetchChainState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Verify Submission (Approve / Reject) action
  const handleVerifySubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/proofs/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          validatorAddress: currentAddress,
          status
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to verify submission');
        return;
      }
      addSdkLog(`Verification Event logged on Stacks L2: Decision: "${status.toUpperCase()}" for submission ID: ${submissionId}. Reward processed.`);
      await fetchChainState();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Claim Testnet STX Faucet
  const handleFaucetClaim = async (address: string) => {
    setIsFaucetLoading(true);
    try {
      const res = await fetch('/api/wallet/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await res.json();
      if (res.ok) {
        addSdkLog(`Faucet interaction: Claimed 1,000 testnet STX for account ${address}`);
        await fetchChainState();
      } else {
        alert(data.error || 'Faucet error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFaucetLoading(false);
    }
  };

  // Manually mine a Stacks block
  const handleMineBlock = async () => {
    setIsMining(true);
    try {
      const res = await fetch('/api/blockchain/mine', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        addSdkLog(`Block #${data.newBlock.height} mined locally on Stacks. Anchored to BTC Block #${data.newBlock.btcAnchorHeight}. Processed ${data.minedTransactionsCount} pending Mempool txs.`);
        await fetchChainState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMining(false);
    }
  };

  // SDK Simulator logs helper
  const addSdkLog = (log: string) => {
    setSdkLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const handleSimulateSdk = async (action: 'tasks' | 'proofs' | 'verify') => {
    setSdkRunningAction(action);
    addSdkLog(`>> Initializing Client-SDK Action execution flow for method "${action}"...`);
    
    // Mimic API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (action === 'tasks') {
      const mockTitles = [
        'SIP-010 custom fungible token transfer hook',
        'Verify BTC multisig anchor scripts',
        'Clarity unit tests for oracle validation telemetry',
        'Implement custom address signature verify routine'
      ];
      const mockDescs = [
        'Write and run assertions inside Clarinet representing standard security vaults.',
        'Validate anchor states returning true or false based on threshold counts.',
        'Write read-only maps looking up external transaction inputs dynamically.',
        'Compute core elliptic curves inside Clarity to match arbitrary keys.'
      ];
      const selectionIdx = Math.floor(Math.random() * mockTitles.length);

      await handleAddTask({
        title: mockTitles[selectionIdx],
        description: mockDescs[selectionIdx],
        rewardPoa: Math.floor(Math.random() * 400) + 100,
        requiredProofType: 'smart_contract',
        difficulty: 'Medium',
        creator: currentAddress
      });
      addSdkLog(`Success: Generated & Broadcasted SDK-derived Activity Task from script client.`);
    } else if (action === 'proofs') {
      // Find a pending task if one exists
      const targetTask = tasks[Math.floor(Math.random() * tasks.length)] || { id: 'task_001' };
      const subNumber = Math.floor(Math.random() * 1000);
      
      await handleSubmitProof({
        taskId: targetTask.id,
        submitterAddress: currentAddress,
        proofUrl: `https://github.com/developer/proof-solution-${subNumber}`,
        proofDetails: 'Executed using the open-source NodeJS SDK connector with cryptographic confirmation parameters.'
      });
      addSdkLog(`Success: Dispatched proof submission sequence via SDK for task ID: ${targetTask.id}.`);
    } else if (action === 'verify') {
      const pendingSub = submissions.find(s => s.status === 'pending');
      if (!pendingSub) {
        addSdkLog(`Alert: No pending submissions in state. SDK skipped verification step. Build some proofs first!`);
      } else {
        await handleVerifySubmission(pendingSub.id, 'approved');
        addSdkLog(`Success: Arbitraged manual validation of proof ${pendingSub.id} through system proxy SDK.`);
      }
    }

    setSdkRunningAction(null);
  };

  const clearSdkLogs = () => {
    setSdkLogs(['// Telemetry logs cleared successfully']);
  };

  return (
    <div className="h-[768px] w-[1024px] bg-[#0A0B0E] text-slate-200 flex font-sans overflow-hidden select-none border border-slate-800 rounded-xl relative">
      
      {/* GLOBAL BACKDROP GLOW */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* --- SIDEBAR PANEL --- */}
      <aside className="w-64 border-r border-slate-800/60 bg-[#0F1116] flex flex-col p-6 z-10">
        
        {/* Branding Logo & App Label */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FF4F18] to-[#FF8C1A] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 block">
              ProofStack L2
            </span>
            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider block">
              Stacks Activity Hub
            </span>
          </div>
        </div>

        {/* Primary Page Navigation */}
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-xs transition-all ${
              activeTab === 'dashboard'
                ? 'text-[#FF4F18] bg-orange-505/10 bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-orange-500" />
            Dashboard Controller
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-xs transition-all ${
              activeTab === 'explore'
                ? 'text-[#FF4F18] bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Explore Task Boards
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-xs transition-all ${
              activeTab === 'submissions'
                ? 'text-[#FF4F18] bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Proof Ingest & Verify
            {submissions.filter(s => s.status === 'pending').length > 0 && (
              <span className="ml-auto bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full">
                {submissions.filter(s => s.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sdk')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-xs transition-all ${
              activeTab === 'sdk'
                ? 'text-[#FF4F18] bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Interactive Developer SDK
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-semibold text-xs transition-all ${
              activeTab === 'contract'
                ? 'text-[#FF4F18] bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            Clarity contract code
          </button>
        </nav>

        {/* Sync Status Info */}
        <div className="mt-auto pt-4 border-t border-slate-800/50 space-y-4">
          <div className="bg-[#12111A] p-3 rounded-lg border border-slate-850">
            <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5">
              <span>Sync status</span>
              {isRefreshing ? (
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
              ) : (
                <button onClick={fetchChainState} className="text-indigo-400 hover:text-indigo-300">
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-350">
                <span className="text-slate-400 text-[11px]">Stacks block:</span>
                <span className="font-mono text-emerald-400 font-bold">#{blockHeight || '...'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-350">
                <span className="text-slate-400 text-[11px]">Bitcoin anchor:</span>
                <span className="font-mono text-amber-500 font-bold">#{btcHeight || '...'}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN STREAM AREA --- */}
      <main className="flex-1 flex flex-col bg-[#0A0B0E] relative overflow-hidden">
        
        {/* UPPER MAIN HEADER */}
        <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-8 bg-[#0A0B0E]/80 backdrop-blur-md z-1">
          
          {/* Global Network Identifier */}
          <div className="flex items-center gap-3.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-200">Bitcoin L2 Mocked Testnet</span>
            </div>
            <span className="h-3 w-px bg-slate-800"></span>
            
            {/* Immediate manual block confirmation control */}
            <button
              onClick={handleMineBlock}
              disabled={isMining}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Anchors and mines pending L2 transactions into Stacks blocks"
            >
              <Cpu className={`w-3 h-3 ${isMining ? 'animate-spin' : ''}`} />
              {isMining ? 'Anchoring...' : 'Mine L2 Block'}
            </button>
          </div>

          {/* Wallet Injection Selector Widget */}
          <WalletWidget
            currentAddress={currentAddress}
            onAddressChange={setCurrentAddress}
            balances={balances}
            onRefresh={fetchChainState}
            onFaucetClaim={handleFaucetClaim}
            isFaucetLoading={isFaucetLoading}
          />
        </header>

        {/* SCROLLABLE INTERACTIVE PAGE VIEWS */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">

          {/* 1. DASHBOARD VIEW (LIVE BLOCKCHAIN HEALTH, MEMPOOL, LEADERBOARDS) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Stats bento Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/40 backdrop-blur-sm">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black">All Tasks</div>
                  <div className="text-2xl font-black text-white">{tasks.length}</div>
                  <div className="text-[9px] text-emerald-500 mt-1 font-medium">🛡️ Open and Sponsoring live</div>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black">Total Submissions</div>
                  <div className="text-2xl font-black text-white">{submissions.length}</div>
                  <div className="text-[9px] text-indigo-400 mt-1 font-medium">
                    {submissions.filter(s => s.status === 'pending').length} pending validation
                  </div>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black">Mempool Backlog</div>
                  <div className="text-2xl font-black text-[#FF8C1A]">
                    {transactions.filter(t => t.status === 'pending').length} <span className="text-xs text-slate-500">txs</span>
                  </div>
                  <div className="text-[9px] text-amber-500 mt-1 font-mono">Click 'Mine L2 Block' above</div>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/40">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black">Current Node Gas</div>
                  <div className="text-2xl font-black text-white">0.051 <span className="text-xs text-slate-500">STX</span></div>
                  <div className="text-[9px] text-slate-500 mt-1 font-medium">Optimized layer anchor</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                
                {/* Left Side: Recent Blocks & Transaction Mempool */}
                <div className="col-span-2 space-y-4">
                  
                  {/* Mempool Pending Transactions Banner */}
                  {transactions.filter(t => t.status === 'pending').length > 0 && (
                    <div className="bg-[#FF4F18]/10 rounded-xl p-4 border border-[#FF4F18]/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <div>
                          <div className="text-xs font-bold text-slate-100">Pending Transactions Detected in Mempool!</div>
                          <div className="text-[10px] text-orange-400/90">Click the 'Mine L2 Block' button in the header to bundle activity on Bitcoin.</div>
                        </div>
                      </div>
                      <button
                        onClick={handleMineBlock}
                        className="bg-gradient-to-r from-[#FF4F18] to-[#FF8C1A] text-white text-[11px] font-bold py-1.5 px-3 rounded shadow cursor-pointer active:scale-95"
                      >
                        Mine and Anchor Now
                      </button>
                    </div>
                  )}

                  {/* Transaction list panel */}
                  <div className="bg-slate-900/20 border border-slate-800/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">On-chain Transactions Stream (Mempool & History)</h3>
                      <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Clarity API v2</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-xs">No transactions registered yet.</div>
                      ) : (
                        transactions.map((tx) => (
                          <div key={tx.txId} className="bg-[#12111A] p-2.5 rounded-lg border border-slate-800/50 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-md ${tx.status === 'mined' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                                <Cpu className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200">
                                  {tx.functionCalled ? `call::${tx.functionCalled}` : 'transfer-stx'}
                                </div>
                                <div className="text-[9px] font-mono text-slate-500">
                                  Tx: <span className="text-slate-400">{tx.txId}</span> | sender: {tx.sender}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded font-sans tracking-wider ${
                                tx.status === 'mined'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-500 animate-pulse'
                              }`}>
                                {tx.status === 'mined' ? `Mined #${tx.blockHeight}` : 'Mempool'}
                              </span>
                              <div className="text-[10px] font-mono mt-0.5 text-indigo-400 font-semibold">
                                {tx.amountPoa > 0 ? `+${tx.amountPoa} POA` : ''} 
                                {tx.amountStx > 0 ? ` [${tx.amountStx} STX]` : ''}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Blocks anchor visualization */}
                  <div className="bg-[#0F1116] p-4 rounded-xl border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                       <Layers className="w-4 h-4 text-indigo-400" /> Stacks Bitcoin Anchor Relay History
                    </h3>

                    <div className="grid grid-cols-5 gap-2">
                      {blocks.slice(0, 5).map((block) => (
                        <div key={block.hash} className="bg-[#0A0B0E] p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between h-20">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 block">BLOCK</span>
                            <span className="text-xs font-mono font-bold text-indigo-400 block">#{block.height}</span>
                          </div>
                          <div className="text-[8px] font-mono text-slate-500 truncate" title={block.hash}>
                            BTC Anchor: #{block.btcAnchorHeight}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Side: Leaderboards & Token Metrics */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Activity Leaderboard</h3>
                  
                  <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4 flex-1 space-y-4">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {leaderboard.slice(0, 5).map((entry) => (
                        <div key={entry.address} className="flex items-center gap-3 group border-b border-slate-800/30 pb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black select-none ${
                            entry.ranking === 1 ? 'bg-amber-500 text-black' :
                            entry.ranking === 2 ? 'bg-slate-400 text-black' :
                            entry.ranking === 3 ? 'bg-amber-700 text-white' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {entry.ranking}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black truncate text-slate-200">{entry.username}</div>
                            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{entry.tier} Contributor</div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-black text-indigo-300 block">{entry.pointsEarned} POA</span>
                            <span className="text-[9px] text-gray-400 block">{entry.tasksCompleted} Tasks Completed</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800/60">
                      <div className="bg-[#FF4F18]/10 rounded-xl p-3.5 border border-[#FF4F18]/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black uppercase text-orange-400">Your Performance Metric</span>
                          <span className="text-[9px] text-slate-500">Address Filtered</span>
                        </div>
                        <div className="text-lg font-black text-white">
                          {(balances[currentAddress]?.poa || 0).toLocaleString()} <span className="text-xs text-slate-500 font-normal">POA Units</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${Math.min(((balances[currentAddress]?.poa || 0) / 1000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* 2. EXPLORE TASKS VIEW (REGISTRY INTERFACES) */}
          {activeTab === 'explore' && (
            <ActivityHub
              tasks={tasks}
              activeAddress={currentAddress}
              onAddTask={handleAddTask}
              onSubmitProof={handleSubmitProof}
              isActionLoading={isActionLoading}
              onTriggerMine={handleMineBlock}
            />
          )}

          {/* 3. PROOF INGEST & VERIFICATION TAB (PLAY AS VALIDATOR) */}
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              
              <div className="bg-[#14121F] p-5 rounded-xl border border-indigo-500/10 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" /> Platform Proof Verification Hub
                  </h2>
                  <p className="text-xs text-gray-400">
                    Review incoming developer proofs. Approve or reject to disburse on-chain escrow rewards automatically.
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-right">
                  <span className="text-[9px] text-slate-550 block font-bold uppercase">Role Identity</span>
                  <span className="text-xs text-indigo-400 font-mono font-bold">ST4KM2...VAL542</span>
                </div>
              </div>

              {/* Submissions Ingestion Grid */}
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="text-center p-12 bg-slate-900/10 rounded-xl border border-slate-800">
                    <HelpCircle className="w-10 h-10 text-gray-650 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No proof submissions have been registered yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submissions.map((sub) => (
                      <div 
                        key={sub.id} 
                        className={`p-4 rounded-xl border flex flex-col justify-between ${
                          sub.status === 'pending'
                            ? 'bg-[#0E0C17] border-amber-500/30'
                            : sub.status === 'approved'
                            ? 'bg-emerald-950/5 border-emerald-500/20'
                            : 'bg-rose-950/5 border-rose-500/20'
                        }`}
                      >
                        <div>
                          {/* Top pill identity */}
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-mono font-black tracking-widest text-[#FF8C1A] uppercase">
                              #{sub.id} Ingestion Target
                            </span>
                            
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                              sub.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : sub.status === 'rejected'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400 animate-pulse'
                            }`}>
                              {sub.status}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-white mb-2 line-clamp-1">
                            {sub.taskTitle}
                          </h3>

                          {/* Submitter details */}
                          <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800/60 space-y-1.5 text-[11px] mb-3 font-mono">
                            <div className="text-slate-400 truncate">
                              Submitter: <span className="text-slate-200">{sub.submitterAddress}</span>
                            </div>
                            <div className="text-indigo-400 truncate flex items-center gap-1">
                              PR / Solution: 
                              <a href="#" className="underline truncate flex items-center gap-0.5 max-w-[200px]" title={sub.proofUrl}>
                                {sub.proofUrl}
                                <ExternalLink className="w-2.5 h-2.5 inline-block" />
                              </a>
                            </div>
                            <div className="pt-1 text-slate-300 font-sans border-t border-slate-800/40 mt-1">
                              "{sub.proofDetails}"
                            </div>
                          </div>
                        </div>

                        {/* Control buttons inside Card feet */}
                        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-2">
                          <div className="text-[10px] text-slate-500 font-mono">
                            {sub.blockHeight ? `Mined Block #${sub.blockHeight}` : 'Pending Confirmation'}
                          </div>

                          {sub.status === 'pending' ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleVerifySubmission(sub.id, 'rejected')}
                                className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer"
                              >
                                Reject Solution
                              </button>
                              <button
                                onClick={() => handleVerifySubmission(sub.id, 'approved')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px] cursor-pointer flex items-center gap-1 shadow"
                              >
                                Approve & Pay
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Checked by Owner
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 4. INTERACTIVE SDK SIMULATOR */}
          {activeTab === 'sdk' && (
            <div className="space-y-6">
              
              <div className="bg-[#14121F] p-4 rounded-xl border border-indigo-500/10">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" /> Open-Source developer SDK Playground
                </h2>
                <p className="text-xs text-gray-400">
                  ProofStack publishes a rich NPM library allowing developers, scripts, and build environments to broadcast task creation or complete submissions automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                
                {/* SDK Code Snippet Panel */}
                <div className="bg-[#0E0C17] border border-gray-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                      <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">NodeJS SDK snippet</span>
                      <span className="text-[#FF8C1A] text-[9px] font-mono">@stacks-poa/sdk-js</span>
                    </div>

                    <pre className="text-[10.5px] font-mono text-indigo-250 leading-relaxed overflow-x-auto text-indigo-300">
{`import { StacksPoaSdk, Buffer } from '@stacks-poa/sdk-js';

// 1. Initialize client using Stacks node URI
const client = new StacksPoaSdk({
  network: 'testnet',
  privateKey: '0x32A...0FF94'
});

// 2. Automate Task creation inside CI workflows
const response = await client.createTask({
  title: "Clarinet test coverage run to 95%",
  rewardPoa: 350,
  difficulty: "Medium",
  proofType: "github_pr"
});

console.log("On-chain task created. ID:", response.taskId);`}
                    </pre>
                  </div>

                  <div className="bg-[#13111E] p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-2 mt-4">
                    <div className="font-bold text-slate-200">Simulate SDK calls in code editor client:</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSimulateSdk('tasks')}
                        disabled={sdkRunningAction !== null}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-1 px-2.5 rounded text-[10px] cursor-pointer"
                      >
                        {sdkRunningAction === 'tasks' ? 'Broadcasting taskId...' : 'Execute: client.createTask()'}
                      </button>
                      <button
                        onClick={() => handleSimulateSdk('proofs')}
                        disabled={sdkRunningAction !== null}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold py-1 px-2.5 rounded text-[10px] cursor-pointer"
                      >
                        {sdkRunningAction === 'proofs' ? 'Dispatching proof...' : 'Execute: client.submitProof()'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Telemetry Output console */}
                <div className="bg-[#0A0711] border border-indigo-950 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between border-b border-indigo-950 pb-2 mb-3">
                    <span className="text-[10px] text-rose-400 uppercase font-bold font-mono">STDOUT Telemetry Console</span>
                    <button onClick={clearSdkLogs} className="text-gray-500 hover:text-gray-300 text-[9px] font-bold">
                      CLEAR TERM
                    </button>
                  </div>

                  <div className="flex-1 min-h-[220px] font-mono text-[10px] text-emerald-450 space-y-1 bg-black/40 p-3 rounded-lg overflow-y-auto max-h-[300px] text-emerald-400">
                    {sdkLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed break-all font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 5. CLARITY SMART CONTRACT VIEW */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="bg-[#14121F] p-4 rounded-xl border border-indigo-500/10 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5 flex-nowrap">
                    <Code className="w-5 h-5 text-indigo-400" /> proof-of-activity.clar (Clarity Smart Contract)
                  </h2>
                  <p className="text-xs text-gray-400">
                    Production Clarity v2 logic deployed. Guarantees deterministic state variables, task structures, and reward payout assertions.
                  </p>
                </div>
                
                <a 
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(clarityContractCode)}`} 
                  download="proof-of-activity.clar"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> Download Contract Code
                </a>
              </div>

              {/* Code display frame */}
              <div className="bg-[#090A0D] border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-[10px] border-b border-slate-900 pb-2.5">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="ml-2 font-mono text-slate-500 uppercase font-bold tracking-wider">production / clarity / core-vault.clar</span>
                </div>

                <div className="max-h-[350px] overflow-y-auto font-mono text-[11px] leading-relaxed text-indigo-300 pr-1 select-text selection:bg-orange-500/30">
                  <pre>{clarityContractCode}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BRIGHT SPARK FOOTER CONTROLS */}
        <footer className="h-10 border-t border-slate-800/40 bg-[#0F1116] flex items-center justify-between px-8 text-[11px] text-slate-500 z-10 shrink-0">
          <span>Proof-of-Activity Platform anchored securely to Stacks L2 Node API</span>
          <span>Build version: <strong className="text-slate-405 font-mono text-indigo-300">v1.0.4-live</strong></span>
        </footer>

      </main>
    </div>
  );
}
