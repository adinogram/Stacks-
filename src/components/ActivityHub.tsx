/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, ProofSubmission } from '../types';
import { 
  Plus, Check, Filter, Search, Award, Sparkles, AlertTriangle, 
  Code, Send, HelpCircle, FileText, ArrowUpRight, Cpu 
} from 'lucide-react';

interface ActivityHubProps {
  tasks: Task[];
  activeAddress: string;
  onAddTask: (task: {
    title: string;
    description: string;
    rewardPoa: number;
    requiredProofType: 'github_pr' | 'code_url' | 'smart_contract' | 'other';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    creator: string;
  }) => Promise<void>;
  onSubmitProof: (submission: {
    taskId: string;
    submitterAddress: string;
    proofUrl: string;
    proofDetails: string;
  }) => Promise<void>;
  isActionLoading: boolean;
  onTriggerMine: () => void;
}

export default function ActivityHub({
  tasks,
  activeAddress,
  onAddTask,
  onSubmitProof,
  isActionLoading,
  onTriggerMine
}: ActivityHubProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Task Creation Modal/Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReward, setNewReward] = useState(250);
  const [newType, setNewType] = useState<'github_pr' | 'code_url' | 'smart_contract' | 'other'>('smart_contract');
  const [newDiff, setNewDiff] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Submission Modal State
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofDetails, setProofDetails] = useState('');

  // Selected Task to View Details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.description.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = diffFilter === 'all' || task.difficulty === diffFilter;
    const matchesType = typeFilter === 'all' || task.requiredProofType === typeFilter;
    return matchesSearch && matchesDiff && matchesType;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newReward) return;

    await onAddTask({
      title: newTitle,
      description: newDesc,
      rewardPoa: Number(newReward),
      requiredProofType: newType,
      difficulty: newDiff,
      creator: activeAddress,
    });

    // Reset
    setNewTitle('');
    setNewDesc('');
    setNewReward(250);
    setNewType('smart_contract');
    setNewDiff('Medium');
    setShowCreateForm(false);
  };

  const handlePostProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskToSubmit || !proofUrl.trim() || !proofDetails.trim()) return;

    await onSubmitProof({
      taskId: activeTaskToSubmit.id,
      submitterAddress: activeAddress,
      proofUrl,
      proofDetails,
    });

    // Reset
    setProofUrl('');
    setProofDetails('');
    setActiveTaskToSubmit(null);
  };

  const getDifficultyBg = (diff: 'Easy' | 'Medium' | 'Hard') => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Medium': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Hard': return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    }
  };

  const getProofIcon = (type: string) => {
    switch (type) {
      case 'smart_contract': return <Cpu className="w-3.5 h-3.5" />;
      case 'github_pr': return <Code className="w-3.5 h-3.5" />;
      case 'code_url': return <FileText className="w-3.5 h-3.5" />;
      default: return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6" id="activity-hub">
      {/* Dynamic Action Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#14121F] p-4 rounded-xl border border-indigo-500/10">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FC6406]" /> Task Registry & Reward Pool
          </h2>
          <p className="text-xs text-gray-400">
            Earn Proof-of-Activity (POA) utility tokens and STX bonuses by completing validated developer items.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4" /> Sponsor New Task On-chain
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Task list and Search filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filtering Tools */}
          <div className="bg-[#0E0C17] p-3 rounded-lg border border-gray-800 flex flex-wrap md:flex-nowrap gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search specs, functions, tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded-md text-xs text-white"
              />
            </div>

            {/* Selector Filters */}
            <div className="flex gap-2 items-center w-full md:w-auto">
              {/* Difficulty */}
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={diffFilter}
                  onChange={(e) => setDiffFilter(e.target.value)}
                  className="bg-[#171523] border border-gray-800 text-xs text-gray-300 rounded p-1"
                >
                  <option value="all">Any Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium font-medium">Medium</option>
                  <option value="Hard font-bold">Hard</option>
                </select>
              </div>

              {/* Requirement type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#171523] border border-gray-800 text-xs text-gray-300 rounded p-1"
              >
                <option value="all">Any Proof Type</option>
                <option value="smart_contract">Clarity Contract ID</option>
                <option value="github_pr">GitHub PR Url</option>
                <option value="code_url">Repository Link</option>
              </select>
            </div>
          </div>

          {/* Tasks Iteration */}
          {filteredTasks.length === 0 ? (
            <div className="text-center p-12 bg-[#0E0C17] rounded-xl border border-gray-800">
              <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-300">No registered tasks match your queries</p>
              <button 
                onClick={() => { setSearch(''); setDiffFilter('all'); setTypeFilter('all'); }}
                className="mt-2 text-xs text-indigo-400 hover:underline"
              >
                Reset active search filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedTask?.id === task.id
                      ? 'bg-indigo-950/20 border-indigo-500 shadow-md shadow-indigo-500/5'
                      : 'bg-[#0E0C17] border-gray-800 hover:border-gray-700 hover:bg-[#13111E]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getDifficultyBg(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                          {getProofIcon(task.requiredProofType)}
                          <span className="capitalize">{task.requiredProofType.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {task.title}
                      </h3>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <Award className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-sm text-emerald-400 font-bold">{task.rewardPoa}</span>
                        <span className="text-[10px] text-emerald-500/80 font-bold">POA</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        +{task.difficulty === 'Hard' ? 50 : task.difficulty === 'Medium' ? 25 : 10} STX Option
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-800/60 pt-2.5 mt-2.5 text-[11px]">
                    <div className="flex items-center gap-3 text-gray-500 font-mono">
                      <span>Total submissions: <strong className="text-gray-300 font-medium">{task.totalSubmissions}</strong></span>
                      <span>•</span>
                      {task.blockHeight ? (
                        <span className="text-indigo-400">Mined block #{task.blockHeight}</span>
                      ) : (
                        <span className="text-amber-500 animate-pulse bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                          Pending on L2 Mempool
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTaskToSubmit(task);
                      }}
                      className="text-[#FC6406] hover:text-[#FF8133] font-semibold flex items-center gap-1 underline focus:outline-none"
                    >
                      Submit Proof <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Column: Selected Task Specification Details */}
        <div className="bg-[#0E0C17] p-5 rounded-xl border border-gray-800 self-start">
          {selectedTask ? (
            <div className="space-y-4">
              <div className="border-b border-gray-800 pb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize inline-block mb-2 ${getDifficultyBg(selectedTask.difficulty)}`}>
                  {selectedTask.difficulty} Level
                </span>
                <h3 className="text-base font-bold text-white">{selectedTask.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2 font-mono">
                  <span>Creator: <strong className="text-indigo-400">{selectedTask.creator}</strong></span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1.5">Description & Goal</h4>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap bg-[#13111E] p-3 rounded border border-gray-800/40">
                  {selectedTask.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Reward Breakdown</h4>
                <div className="bg-[#13111E] p-3 rounded-lg border border-green-500/10 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Utility Tokens</div>
                    <div className="text-base font-bold text-green-400 font-mono">{selectedTask.rewardPoa} POA</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-mono">Locked Escrow STX</div>
                    <div className="text-base font-bold text-orange-400 font-mono">
                      {selectedTask.difficulty === 'Hard' ? 50 : selectedTask.difficulty === 'Medium' ? 25 : 10} STX
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] text-gray-400">
                <div className="flex justify-between">
                  <span>Proof Category:</span>
                  <span className="text-indigo-300 font-medium uppercase">{selectedTask.requiredProofType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mined Block Height:</span>
                  <span>{selectedTask.blockHeight ? `#${selectedTask.blockHeight}` : 'Unconfirmed'}</span>
                </div>
                {selectedTask.txId && (
                  <div className="flex justify-between">
                    <span>L2 Transaction hash:</span>
                    <span className="text-indigo-400 max-w-32 truncate">{selectedTask.txId}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTaskToSubmit(selectedTask)}
                className="w-full bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-medium py-2 px-4 rounded-lg text-xs cursor-pointer text-center flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" /> Submit Working Proof Now
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-xs">Select tasks in the registry list to inspect details, lock requirements, developer rewards, and submit proof.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- TASK CREATION MODAL --- */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0E0C17] border border-indigo-500/30 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Sponsor Tasks On-chain (Sip-010 Integration)
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-normal">
              Broadcasting this will initiate a simulated Clarity smart contract call and lock your STX in escrow until developers deliver checked execution.
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Task Title / Primary Deliverable</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Integrate custom oracle values on testnet stacker"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Functional Description & Target Criteria</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Demonstrate how developers can inspect Clarity maps. Provide GitHub links or contract coordinates."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded text-xs text-white font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Proof Parameter</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2 bg-[#171523] border border-gray-800 text-xs text-gray-200 rounded"
                  >
                    <option value="smart_contract">Clarity Smart Contract Principal ID</option>
                    <option value="github_pr">Verified Github Pull Request</option>
                    <option value="code_url">Repository or Archive Target Link</option>
                    <option value="other">Platform Logs Details</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Difficulty Metric (Escrows Lock Balance)</label>
                  <select
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value as any)}
                    className="w-full p-2 bg-[#171523] border border-gray-800 text-xs text-gray-200 rounded"
                  >
                    <option value="Easy">Easy (Locks 20 STX Escrow)</option>
                    <option value="Medium">Medium (Locks 50 STX Escrow)</option>
                    <option value="Hard">Hard (Locks 100 STX Escrow)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Reward Token Size (Custom POA utility mint size)</label>
                <input
                  type="number"
                  min={20}
                  max={2500}
                  required
                  value={newReward}
                  onChange={(e) => setNewReward(Number(e.target.value))}
                  className="w-full p-2 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded text-xs text-white"
                />
              </div>

              {/* Warnings */}
              <div className="bg-[#1A1825] p-3 rounded border border-yellow-500/10 text-[11px] text-yellow-500/90 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>
                  Broadcasting this transaction commands locking in STX based on difficulty. Ensure your simulated wallet is funded (use Faucet in wallet panel if required).
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded text-xs cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-[#FC6406] hover:bg-[#E54D00] text-white px-4 py-1.5 rounded text-xs cursor-pointer font-medium flex items-center gap-1"
                >
                  {isActionLoading ? 'Broadcasting...' : 'Sign & Broadcast to Mempool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PROOF SUBMISSION MODAL --- */}
      {activeTaskToSubmit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0E0C17] border border-indigo-500/30 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Send className="w-5 h-5 text-[#FC6406]" /> Submit Proof of Completion
            </h3>
            <p className="text-xs text-indigo-400 capitalize mb-4 font-mono">
              Target Activity Task: "{activeTaskToSubmit.title}"
            </p>

            <form onSubmit={handlePostProof} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Required Proof Resource ({activeTaskToSubmit.requiredProofType.replace('_', ' ')})
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activeTaskToSubmit.requiredProofType === 'smart_contract'
                      ? 'e.g., ST1NX0...DEV101.testnet-anchor-v2'
                      : activeTaskToSubmit.requiredProofType === 'github_pr'
                      ? 'e.g., https://github.com/myorg/stacks-poa/pull/420'
                      : 'e.g., https://github.com/myorg/relay-tester-logs'
                  }
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Implementation Log Notes / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail how you satisfied the requirements of the smart contract logic so oracles/validators can instantly approve your payout."
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  className="w-full p-2.5 bg-[#171523] border border-gray-800 focus:border-indigo-500/50 focus:outline-none rounded text-xs text-white"
                />
              </div>

              <div className="p-3 bg-indigo-950/20 rounded border border-indigo-500/10 text-[11px] text-indigo-300">
                🚀 Submitting sends gas fees from your connected account, lodging transaction indicators on-chain. Go to Explorer page to mine or see block updates!
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTaskToSubmit(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded text-xs cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs cursor-pointer font-medium"
                >
                  {isActionLoading ? 'Broadcasting...' : 'Broadcast Completion Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
