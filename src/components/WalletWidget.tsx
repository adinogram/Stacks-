/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wallet, Coins, RefreshCw, Key, ChevronDown, CheckCircle, Database } from 'lucide-react';

interface WalletWidgetProps {
  currentAddress: string;
  onAddressChange: (address: string) => void;
  balances: Record<string, { address: string; stx: number; poa: number; label: string }>;
  onRefresh: () => void;
  onFaucetClaim: (address: string) => Promise<void>;
  isFaucetLoading: boolean;
}

export default function WalletWidget({
  currentAddress,
  onAddressChange,
  balances,
  onRefresh,
  onFaucetClaim,
  isFaucetLoading
}: WalletWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [walletType, setWalletType] = useState<'leather' | 'xverse'>('leather');
  const [seedStep, setSeedStep] = useState(false);

  const activeWallet = balances[currentAddress] || {
    address: currentAddress,
    stx: 0,
    poa: 0,
    label: 'Guest Developer'
  };

  const handleSelectWallet = (address: string) => {
    onAddressChange(address);
    setIsOpen(false);
  };

  return (
    <div className="relative" id="wallet-sim-widget">
      {/* Wallet Pill */}
      <div className="flex items-center gap-2 bg-[#1A1825] border border-indigo-500/30 p-1.5 px-3 rounded-lg hover:border-indigo-500/60 transition-all duration-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-gray-200 hover:text-white font-medium focus:outline-none"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-gray-400 font-mono text-xs">{currentAddress}</span>
          <span className="bg-indigo-900/40 text-indigo-300 font-medium px-2 py-0.5 rounded text-[11px] border border-indigo-500/20">
            {activeWallet.label}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        <div className="h-4 w-px bg-gray-800" />

        {/* Balances Quick-View */}
        <div className="flex items-center gap-3 pl-1 pr-1">
          <div className="flex items-center gap-1.5" title="Stacks (STX) Balance">
            <Coins className="w-3.5 h-3.5 text-[#F7931A]" />
            <span className="font-mono text-xs text-white font-semibold">
              {activeWallet.stx.toLocaleString()} <span className="text-[10px] text-gray-400">STX</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5" title="Proof-of-Activity (POA) Balance">
            <Coins className="w-3.5 h-3.5 text-[#FC6406]" />
            <span className="font-mono text-xs text-indigo-300 font-semibold">
              {activeWallet.poa.toLocaleString()} <span className="text-[10px] text-indigo-400">POA</span>
            </span>
          </div>
        </div>
      </div>

      {/* Dropdown Wallet Controller */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-[#12111A] border border-indigo-500/30 rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stacks Wallet Injector</span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setWalletType('leather')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  walletType === 'leather'
                    ? 'bg-[#F26522] text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Leather
              </button>
              <button
                onClick={() => setWalletType('xverse')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                  walletType === 'xverse'
                    ? 'bg-[#15D483] text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Xverse
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mb-3">
            Simulate native Stacks-Bitcoin L2 connections. Switch user keys below to interact from different perspectives.
          </p>

          {/* Accounts List */}
          <div className="space-y-2 mb-4">
            {Object.values(balances).map((wallet) => (
              <button
                key={wallet.address}
                onClick={() => handleSelectWallet(wallet.address)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                  currentAddress === wallet.address
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-[#161521] border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-[#1E1D2D]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{wallet.label}</span>
                    {currentAddress === wallet.address && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">{wallet.address}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-gray-200">
                    {wallet.stx.toLocaleString()} STX
                  </div>
                  <div className="text-[10px] font-mono text-indigo-400">
                    {wallet.poa.toLocaleString()} POA
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Faucet & Interactive Actions */}
          <div className="bg-[#1A1825] p-3 rounded-lg border border-indigo-500/10 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-medium flex items-center gap-1">
                <Database className="w-3 h-3 text-amber-500" /> Need Testnet Funds?
              </span>
              <button
                onClick={onRefresh}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                title="Sync on-chain states"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            
            <button
              onClick={() => onFaucetClaim(currentAddress)}
              disabled={isFaucetLoading}
              className="w-full bg-[#FC6406] hover:bg-[#E54D00] disabled:opacity-40 text-white font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
            >
              <Coins className="w-3.5 h-3.5" />
              {isFaucetLoading ? 'Requesting...' : 'Claim 1,000 STX Testnet Faucet'}
            </button>
          </div>

          {/* Seed Phrase Mock View */}
          <div className="mt-3 text-center">
            <button
              onClick={() => setSeedStep(!seedStep)}
              className="text-[10px] text-gray-500 hover:text-gray-400 inline-flex items-center gap-1"
            >
              <Key className="w-3 h-3" /> {seedStep ? 'Hide configuration detail' : 'View cryptographic settings'}
            </button>
            {seedStep && (
              <div className="mt-2 p-2 bg-[#0E0D14] rounded border border-gray-800 text-left">
                <div className="text-[9px] text-amber-500 font-mono mb-1">MOCK SEED PHRASE:</div>
                <code className="text-[9px] font-mono text-gray-400 leading-normal block">
                  stack wallet anchor proof activity key private legacy btc stacks token developer chain
                </code>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
