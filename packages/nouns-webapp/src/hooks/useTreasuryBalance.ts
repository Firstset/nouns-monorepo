import { useEffect, useState, useRef } from 'react';
import { useEtherBalance, useEthers } from '@usedapp/core';
import { useCoingeckoPrice } from '@usedapp/coingecko';
import config from '../config';
import { ethers } from 'ethers';

/**
 * Computes treasury balance (ETH + Lido)
 *
 * @returns Total balance of treasury (ETH + Lido) as EthersBN
 */
export const useTreasuryBalance = () => {
  const [fallbackBalance, setFallbackBalance] = useState<ethers.BigNumber | undefined>(undefined);
  const { library, account } = useEthers();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Try to get balance using useEtherBalance first
  const ethBalance = useEtherBalance(config.addresses.nounsDaoExecutor);
  const isWalletConnected = !!account;

  // Fetch balance using direct provider
  const fetchBalance = async () => {
    if (!isMountedRef.current) return;
    
    try {
      // Create a direct provider connection for Berachain
      const rpcUrl = "https://rpc.berachain.com/";
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Use the correct treasury address for Berachain
      const treasuryAddress = "0x8cb4a504ECD256BdbdDdEdBb9Fe7fD56e2A736F6";
      const balance = await provider.getBalance(treasuryAddress);
      
      if (isMountedRef.current) {
        setFallbackBalance(balance);
      }
    } catch (error) {
      console.error('Error fetching treasury balance:', error);
    }
  };

  // Initialize fallback on mount and when wallet connection changes
  useEffect(() => {
    isMountedRef.current = true;
    
    // Always fetch the fallback balance when not connected
    if (!isWalletConnected) {
      fetchBalance();
      
      // Set up interval for periodic refresh
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchBalance, 30000);
      }
    }
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isWalletConnected]);

  // Determine which balance to use
  const finalBalance = isWalletConnected 
    ? ethBalance 
    : fallbackBalance;

  return finalBalance;
};

/**
 * Computes treasury usd value of treasury assets (ETH + Lido) at current BERA-USD exchange rate
 *
 * @returns USD value of treasury assets (ETH + Lido) at current exchange rate
 */
export const useTreasuryUSDValue = () => {
  const etherPrice = Number(useCoingeckoPrice('ethereum', 'usd'));
  const treasuryBalanceETH = Number(
    ethers.utils.formatEther(useTreasuryBalance()?.toString() || '0'),
  );
  return etherPrice * treasuryBalanceETH;
};
