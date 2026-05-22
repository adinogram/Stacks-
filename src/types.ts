/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  creator: string;
  title: string;
  description: string;
  rewardPoa: number;
  requiredProofType: 'github_pr' | 'code_url' | 'smart_contract' | 'other';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalSubmissions: number;
  activeStatus: boolean;
  txId?: string;
  blockHeight?: number;
  createdAt: string;
}

export interface ProofSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  submitterAddress: string;
  proofUrl: string;
  proofDetails: string;
  status: 'pending' | 'approved' | 'rejected';
  validatorAddress?: string;
  rewardClaimed: boolean;
  rewardTxId?: string;
  submissionTxId: string;
  blockHeight?: number;
  timestamp: string;
}

export interface StacksTransaction {
  txId: string;
  sender: string;
  recipient: string;
  amountStx: number; // For creating tasks, gas, rewards
  amountPoa: number; // PoA Token reward
  feeStx: number;
  functionCalled?: string;
  contractId?: string;
  blockHeight?: number;
  status: 'pending' | 'mined' | 'failed';
  timestamp: string;
  btctxId?: string; // Anchored Bitcoin transaction ID
}

export interface StacksBlock {
  height: number;
  hash: string;
  previousHash: string;
  txCount: number;
  minerAddress: string;
  btcAnchorHeight: number;
  btcAnchorHash: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  address: string;
  username: string;
  tasksCompleted: number;
  pointsEarned: number; // Sum of custom PoA token balance
  ranking?: number;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
}

export interface WebSdkAction {
  id: string;
  name: string;
  method: string;
  payload: string;
  response: string;
  timestamp: string;
}
