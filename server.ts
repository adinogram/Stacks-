/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Task, ProofSubmission, StacksTransaction, StacksBlock, LeaderboardEntry } from './src/types';

const app = express();
app.use(express.json());

const PORT = 3000;

// In-Memory Stacks L2 State Simulator
let blockHeight = 142510;
let btcHeight = 844850;

let blocks: StacksBlock[] = [];
let transactions: StacksTransaction[] = [];
let tasks: Task[] = [];
let submissions: ProofSubmission[] = [];

// Track balances for wallets
interface WalletState {
  address: string;
  stx: number;
  poa: number;
  label: string;
}

const initialBalances: Record<string, WalletState> = {
  'ST1NX0...DEV101': { address: 'ST1NX0...DEV101', stx: 5000, poa: 240, label: 'Dev Wallet A' },
  'ST2VY3...WAL671': { address: 'ST2VY3...WAL671', stx: 12000, poa: 1450, label: 'Task Creator Pro' },
  'ST3QA9...SUB899': { address: 'ST3QA9...SUB899', stx: 450, poa: 75, label: 'Developer Submitter' },
  'ST4KM2...VAL542': { address: 'ST4KM2...VAL542', stx: 8100, poa: 320, label: 'Platform Validator' },
};

// Helper to generate transaction ID, block hash, etc.
const makeId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

// Bootstrap initial blockchain state
function initMockChain() {
  // 1. Initial Blocks
  for (let i = 0; i < 5; i++) {
    const height = blockHeight - (4 - i);
    const btcAnchorHeight = btcHeight - (4 - i);
    blocks.push({
      height,
      hash: `0x${Math.random().toString(16).substring(2, 18).toUpperCase()}`,
      previousHash: i === 0 ? '0x8A2E9F24147BCCB6' : blocks[i - 1].hash,
      txCount: i === 4 ? 0 : Math.floor(Math.random() * 3) + 1,
      minerAddress: 'ST2VY3...WAL671',
      btcAnchorHeight,
      btcAnchorHash: `0000000000000000000${Math.random().toString(16).substring(2, 8)}`,
      timestamp: new Date(Date.now() - (4 - i) * 60000).toISOString(),
    });
  }

  // 2. Pre-seeded Tasks
  tasks.push({
    id: 'task_001',
    creator: 'ST2VY3...WAL671',
    title: 'Deploy a clarity hello-world contract to Testnet',
    description: 'Write a basic Clarity v2 smart contract that implements a read-only greeting method and a public write function to change it. Deploy it and submit the contract principal ID.',
    rewardPoa: 150,
    requiredProofType: 'smart_contract',
    difficulty: 'Easy',
    totalSubmissions: 2,
    activeStatus: true,
    txId: 'tx_INITIAL_T01',
    blockHeight: blockHeight - 4,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  });

  tasks.push({
    id: 'task_002',
    creator: 'ST2VY3...WAL671',
    title: 'Integrate STX Connect into an OSS template',
    description: 'Build a Next.js interface that uses @stacks/connect to authenticate a user wallet and fetch SIP-010 token balances. Provide the GitHub PR link showcasing the implementation.',
    rewardPoa: 350,
    requiredProofType: 'github_pr',
    difficulty: 'Medium',
    totalSubmissions: 1,
    activeStatus: true,
    txId: 'tx_INITIAL_T02',
    blockHeight: blockHeight - 3,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  });

  tasks.push({
    id: 'task_003',
    creator: 'ST2VY3...WAL671',
    title: 'Implements a Stacks L2 BTC-Anchor Relay script',
    description: 'Authorize an endpoint that tracks Stacks block anchoring on the Bitcoin network using custom Stacks API endpoints. Must include comprehensive unit tests.',
    rewardPoa: 800,
    requiredProofType: 'code_url',
    difficulty: 'Hard',
    totalSubmissions: 0,
    activeStatus: true,
    txId: 'tx_INITIAL_T03',
    blockHeight: blockHeight - 2,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  });

  // 3. Pre-seeded Proof Submissions
  submissions.push({
    id: 'proof_001',
    taskId: 'task_001',
    taskTitle: 'Deploy a clarity hello-world contract to Testnet',
    submitterAddress: 'ST1NX0...DEV101',
    proofUrl: 'ST1NX0...DEV101.hello-world-v1',
    proofDetails: 'Contract contains write restrictions and custom events. Functions successfully tested inside Clarity REPL.',
    status: 'approved',
    validatorAddress: 'ST4KM2...VAL542',
    rewardClaimed: true,
    rewardTxId: 'tx_REWARD_001',
    submissionTxId: 'tx_INITIAL_SUB1',
    blockHeight: blockHeight - 3,
    timestamp: new Date(Date.now() - 3.5 * 60000).toISOString(),
  });

  submissions.push({
    id: 'proof_002',
    taskId: 'task_001',
    taskTitle: 'Deploy a clarity hello-world contract to Testnet',
    submitterAddress: 'ST3QA9...SUB899',
    proofUrl: 'ST3QA9...SUB899.hello-world',
    proofDetails: 'A clean implementation of SIP-009 standard, containing the basic map definitions and read queries.',
    status: 'pending',
    rewardClaimed: false,
    submissionTxId: 'tx_INITIAL_SUB2',
    blockHeight: blockHeight - 1,
    timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
  });

  // 4. Pre-seeded Transactions
  transactions.push({
    txId: 'tx_INITIAL_T01',
    sender: 'ST2VY3...WAL671',
    recipient: 'ST39G2M7...proof-of-activity-v1',
    amountStx: 200,
    amountPoa: 0,
    feeStx: 0.18,
    functionCalled: 'create-task',
    contractId: 'ST39G2M7...proof-of-activity-v1',
    blockHeight: blockHeight - 4,
    status: 'mined',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    btctxId: `btc_tx_${makeId('BTC')}`,
  });

  transactions.push({
    txId: 'tx_INITIAL_SUB1',
    sender: 'ST1NX0...DEV101',
    recipient: 'ST39G2M7...proof-of-activity-v1',
    amountStx: 0,
    amountPoa: 0,
    feeStx: 0.05,
    functionCalled: 'submit-proof',
    contractId: 'ST39G2M7...proof-of-activity-v1',
    blockHeight: blockHeight - 3,
    status: 'mined',
    timestamp: new Date(Date.now() - 3.5 * 60000).toISOString(),
    btctxId: `btc_tx_${makeId('BTC')}`,
  });

  transactions.push({
    txId: 'tx_REWARD_001',
    sender: 'ST39G2M7...proof-of-activity-v1',
    recipient: 'ST1NX0...DEV101',
    amountStx: 50,
    amountPoa: 150,
    feeStx: 0.15,
    functionCalled: 'verify-submission',
    contractId: 'ST39G2M7...proof-of-activity-v1',
    blockHeight: blockHeight - 3,
    status: 'mined',
    timestamp: new Date(Date.now() - 3.3 * 60000).toISOString(),
    btctxId: `btc_tx_${makeId('BTC')}`,
  });
}

initMockChain();

// API Endpoints: State Getters
app.get('/api/tasks', (req, res) => {
  res.json({ tasks });
});

app.get('/api/proofs', (req, res) => {
  res.json({ submissions });
});

app.get('/api/blockchain/status', (req, res) => {
  res.json({
    blockHeight,
    btcHeight,
    latestBlocks: blocks.slice().reverse().slice(0, 5),
    balances: initialBalances,
  });
});

app.get('/api/blockchain/transactions', (req, res) => {
  res.json({ transactions: transactions.slice().reverse() });
});

app.get('/api/blockchain/blocks', (req, res) => {
  res.json({ blocks: blocks.slice().reverse() });
});

// Create task POST (simulates on-chain transaction)
app.post('/api/tasks', (req, res) => {
  const { title, description, rewardPoa, requiredProofType, difficulty, creator } = req.body;

  if (!title || !description || !rewardPoa || !creator) {
    return res.status(400).json({ error: 'Missing parameter values' });
  }

  // Spend STX for creating task on-chain
  const creatorWallet = initialBalances[creator];
  const creationCostStx = difficulty === 'Hard' ? 100 : difficulty === 'Medium' ? 50 : 20;

  if (creatorWallet && creatorWallet.stx < creationCostStx) {
    return res.status(400).json({ error: `Insufficient STX balance. Creating a ${difficulty} task requires locking ${creationCostStx} STX.` });
  }

  if (creatorWallet) {
    creatorWallet.stx -= creationCostStx;
  }

  const txId = makeId('tx');
  const taskId = makeId('task');

  // Create on-chain transaction
  const newTx: StacksTransaction = {
    txId,
    sender: creator,
    recipient: 'ST39G2M7...proof-of-activity-v1',
    amountStx: creationCostStx,
    amountPoa: 0,
    feeStx: 0.25,
    functionCalled: 'create-task',
    contractId: 'ST39G2M7...proof-of-activity-v1',
    status: 'pending', // Awaiting manual or interval block mining
    timestamp: new Date().toISOString(),
  };

  const newTask: Task = {
    id: taskId,
    creator,
    title,
    description,
    rewardPoa: Number(rewardPoa),
    requiredProofType,
    difficulty,
    totalSubmissions: 0,
    activeStatus: true,
    txId,
    createdAt: new Date().toISOString(),
  };

  transactions.push(newTx);
  tasks.push(newTask);

  res.status(201).json({
    message: 'Task broadcasted on Stacks L2 mempool!',
    task: newTask,
    transaction: newTx,
  });
});

// Submit proof POST
app.post('/api/proofs', (req, res) => {
  const { taskId, submitterAddress, proofUrl, proofDetails } = req.body;

  if (!taskId || !submitterAddress || !proofUrl || !proofDetails) {
    return res.status(400).json({ error: 'Missing submission arguments' });
  }

  const targetTask = tasks.find(t => t.id === taskId);
  if (!targetTask) {
    return res.status(404).json({ error: 'Task not found' });
  }

  targetTask.totalSubmissions += 1;

  const txId = makeId('tx');
  const submissionId = makeId('proof');

  const newTx: StacksTransaction = {
    txId,
    sender: submitterAddress,
    recipient: 'ST39G2M7...proof-of-activity-v1',
    amountStx: 0,
    amountPoa: 0,
    feeStx: 0.08,
    functionCalled: 'submit-proof',
    contractId: 'ST39G2M7...proof-of-activity-v1',
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  const newSubmission: ProofSubmission = {
    id: submissionId,
    taskId,
    taskTitle: targetTask.title,
    submitterAddress,
    proofUrl,
    proofDetails,
    status: 'pending',
    submissionTxId: txId,
    rewardClaimed: false,
    timestamp: new Date().toISOString(),
  };

  transactions.push(newTx);
  submissions.push(newSubmission);

  res.status(201).json({
    message: 'Proof submission broadcasted on-chain for verification!',
    submission: newSubmission,
    transaction: newTx,
  });
});

// Verify submission POST
app.post('/api/proofs/verify', (req, res) => {
  const { submissionId, validatorAddress, status } = req.body; // status: 'approved' | 'rejected'

  if (!submissionId || !validatorAddress || !status) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const submission = submissions.find(s => s.id === submissionId);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  if (submission.status !== 'pending') {
    return res.status(400).json({ error: 'Submission has already been verified' });
  }

  const targetTask = tasks.find(t => t.id === submission.taskId);
  if (!targetTask) {
    return res.status(404).json({ error: 'Associated task not found' });
  }

  submission.status = status;
  submission.validatorAddress = validatorAddress;

  const txId = makeId('tx');

  if (status === 'approved') {
    // Reward execution!
    submission.rewardClaimed = true;
    submission.rewardTxId = txId;

    // Credit rewards to submitter!
    if (!initialBalances[submission.submitterAddress]) {
      initialBalances[submission.submitterAddress] = {
        address: submission.submitterAddress,
        stx: 10,
        poa: 0,
        label: 'Developer User',
      };
    }
    initialBalances[submission.submitterAddress].poa += targetTask.rewardPoa;
    // Reward bonus STX unlocked
    const rewardBtcUnlocked = targetTask.difficulty === 'Hard' ? 50 : targetTask.difficulty === 'Medium' ? 25 : 10;
    initialBalances[submission.submitterAddress].stx += rewardBtcUnlocked;

    // Pay a micro STX validation reward to validator
    if (initialBalances[validatorAddress]) {
      initialBalances[validatorAddress].stx += 2.5; // reward validators
    }

    // Add minting transaction
    const rewardTx: StacksTransaction = {
      txId,
      sender: 'ST39G2M7...proof-of-activity-v1',
      recipient: submission.submitterAddress,
      amountStx: rewardBtcUnlocked,
      amountPoa: targetTask.rewardPoa,
      feeStx: 0.1,
      functionCalled: 'verify-submission',
      contractId: 'ST39G2M7...proof-of-activity-v1',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    transactions.push(rewardTx);
  } else {
    // Add transaction recording rejected verification
    const rejectTx: StacksTransaction = {
      txId,
      sender: validatorAddress,
      recipient: 'ST39G2M7...proof-of-activity-v1',
      amountStx: 0,
      amountPoa: 0,
      feeStx: 0.05,
      functionCalled: 'verify-submission',
      contractId: 'ST39G2M7...proof-of-activity-v1',
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    transactions.push(rejectTx);
  }

  res.json({
    message: `Result successfully logged on-chain. Submissions evaluated as ${status}!`,
    submission,
  });
});

// Faucet POST
app.post('/api/wallet/faucet', (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!initialBalances[address]) {
    initialBalances[address] = {
      address,
      stx: 0,
      poa: 0,
      label: 'Interactive Builder',
    };
  }

  // Add 1,000 STX testnet faucet!
  initialBalances[address].stx += 1000;

  const txId = makeId('tx_faucet');
  const faucetTx: StacksTransaction = {
    txId,
    sender: 'ST39G2M7...testnet-faucet',
    recipient: address,
    amountStx: 1000,
    amountPoa: 0,
    feeStx: 0.0,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };

  transactions.push(faucetTx);

  res.json({
    message: 'Testnet STX claimed successfully! 1,000 STX added to your wallet wallet.',
    transaction: faucetTx,
    balance: initialBalances[address],
  });
});

// Mine Block manual POST
app.post('/api/blockchain/mine', (req, res) => {
  const pendingTxs = transactions.filter(t => t.status === 'pending');

  blockHeight += 1;
  btcHeight += 1;

  const newBlockHash = `0x${Math.random().toString(16).substring(2, 18).toUpperCase()}`;

  // Mine pending transactions
  pendingTxs.forEach(t => {
    t.status = 'mined';
    t.blockHeight = blockHeight;
    t.btctxId = `btc_tx_${makeId('BTC')}`;
  });

  // Assign mined block height to tasks and submissions associated
  tasks.forEach(task => {
    if (task.txId && !task.blockHeight) {
      const relatedTx = transactions.find(t => t.txId === task.txId);
      if (relatedTx && relatedTx.status === 'mined') {
        task.blockHeight = blockHeight;
      }
    }
  });

  submissions.forEach(sub => {
    if (sub.submissionTxId && !sub.blockHeight) {
      const relatedTx = transactions.find(t => t.txId === sub.submissionTxId);
      if (relatedTx && relatedTx.status === 'mined') {
        sub.blockHeight = blockHeight;
      }
    }
  });

  const newBlock: StacksBlock = {
    height: blockHeight,
    hash: newBlockHash,
    previousHash: blocks[blocks.length - 1]?.hash || '0xDEADBEEF',
    txCount: pendingTxs.length,
    minerAddress: 'ST2VY3...WAL671',
    btcAnchorHeight: btcHeight,
    btcAnchorHash: `0000000000000000000${Math.random().toString(16).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  blocks.push(newBlock);

  res.json({
    message: `Perfect! Block #${blockHeight} successfully mined on Stacks Bitcoin L2 and anchored to BTC block #${btcHeight}!`,
    newBlock,
    minedTransactionsCount: pendingTxs.length,
  });
});

// Leaderboard Dynamic Generator
app.get('/api/leaderboard', (req, res) => {
  const dynamicLeaderboard: LeaderboardEntry[] = [];

  // Parse state balances
  Object.values(initialBalances).forEach(wallet => {
    // calculate completed proofs
    const completedCount = submissions.filter(
      s => s.submitterAddress === wallet.address && s.status === 'approved'
    ).length;

    let tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' = 'Bronze';
    if (wallet.poa >= 1000) tier = 'Diamond';
    else if (wallet.poa >= 500) tier = 'Gold';
    else if (wallet.poa >= 150) tier = 'Silver';

    dynamicLeaderboard.push({
      address: wallet.address,
      username: wallet.label,
      tasksCompleted: completedCount,
      pointsEarned: wallet.poa,
      tier,
    });
  });

  // Sort and assign rankings
  dynamicLeaderboard.sort((a, b) => b.pointsEarned - a.pointsEarned);
  dynamicLeaderboard.forEach((entry, idx) => {
    entry.ranking = idx + 1;
  });

  res.json({ leaderboard: dynamicLeaderboard });
});

// Setup Vite & Frontend static routing
async function run() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Stacks Bitcoin L2 PoA Server running on http://localhost:${PORT}`);
  });
}

run();
