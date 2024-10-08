import { useEtherBalance } from '@usedapp/core';
import useLidoBalance from './useLidoBalance';
import useTokenBuyerBalance from './useTokenBuyerBalance';
import { useCoingeckoPrice } from '@usedapp/coingecko';
import config from '../config';
import { BigNumber, ethers } from 'ethers';

/**
 * Computes treasury balance (ETH + Lido)
 *
 * @returns Total balance of treasury (ETH + Lido) as EthersBN
 */
export const useTreasuryBalance = () => {

  const ethBalance = useEtherBalance(config.addresses.nounsDaoExecutor);
  
  return ethBalance
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
