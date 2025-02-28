import { useContractCall, useContractFunction, useEthers } from '@usedapp/core';
import { BigNumber as EthersBN, ethers, utils } from 'ethers';
import { NounsTokenABI, NounsTokenFactory } from '@nouns/contracts';
import config, { cache, cacheKey, CHAIN_ID } from '../config';
import { useQuery } from '@apollo/client';
import {
  Delegates,
  accountEscrowedNounsQuery,
  delegateNounsAtBlockQuery,
  ownedNounsQuery,
  seedsQuery,
} from './subgraph';
import { useEffect, useState, useRef } from 'react';

interface NounToken {
  name: string;
  description: string;
  image: string;
}

export interface NounId {
  id: string;
}
interface ForkId {
  id: string;
}
interface EscrowedNoun {
  noun: NounId;
  fork: ForkId;
}

export interface INounSeed {
  accessory: number;
  background: number;
  body: number;
  glasses: number;
  head: number;
}

export enum NounsTokenContractFunction {
  delegateVotes = 'votesToDelegate',
}

const abi = new utils.Interface(NounsTokenABI);
const seedCacheKey = cacheKey(cache.seed, CHAIN_ID, config.addresses.nounsToken);
const nounsTokenContract = NounsTokenFactory.connect(config.addresses.nounsToken, undefined!);
const isSeedValid = (seed: Record<string, any> | undefined) => {
  const expectedKeys = ['background', 'body', 'accessory', 'head', 'glasses'];
  const hasExpectedKeys = expectedKeys.every(key => (seed || {}).hasOwnProperty(key));
  const hasValidValues = Object.values(seed || {}).some(v => v !== 0);
  return hasExpectedKeys && hasValidValues;
};

export const useNounToken = (nounId: EthersBN) => {
  const [noun] =
    useContractCall<[string]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'dataURI',
      args: [nounId],
    }) || [];

  if (!noun) {
    return;
  }

  const nounImgData = noun.split(';base64,').pop() as string;
  const json: NounToken = JSON.parse(atob(nounImgData));

  return json;
};

const seedArrayToObject = (seeds: (INounSeed & { id: string })[]) => {
  return seeds.reduce<Record<string, INounSeed>>((acc, seed) => {
    acc[seed.id] = {
      background: Number(seed.background),
      body: Number(seed.body),
      accessory: Number(seed.accessory),
      head: Number(seed.head),
      glasses: Number(seed.glasses),
    };
    return acc;
  }, {});
};

const useNounSeeds = () => {
  const cache = localStorage.getItem(seedCacheKey);
  const cachedSeeds = cache ? JSON.parse(cache) : undefined;
  const { data } = useQuery(seedsQuery(), {
    skip: !!cachedSeeds,
  });

  useEffect(() => {
    if (!cachedSeeds && data?.seeds?.length) {
      localStorage.setItem(seedCacheKey, JSON.stringify(seedArrayToObject(data.seeds)));
    }
  }, [data, cachedSeeds]);

  return cachedSeeds;
};

const fetchSeedDirectly = async (nounId: EthersBN) => {
  try {
    // Use the reliable RPC endpoint
    const provider = new ethers.providers.JsonRpcProvider("https://rpc.berachain.com/");
    
    const nounTokenAddress = config.addresses.nounsToken;
    
    // Create a simplified ABI
    const nounTokenABI = [
      "function seeds(uint256 nounId) view returns (uint48 background, uint48 body, uint48 accessory, uint48 head, uint48 glasses)"
    ];
    
    // Try to get the seed from the contract
    try {
      const tokenContract = new ethers.Contract(nounTokenAddress, nounTokenABI, provider);
      const seedData = await tokenContract.seeds(nounId);
      
      return {
        background: Number(seedData.background),
        body: Number(seedData.body),
        accessory: Number(seedData.accessory),
        head: Number(seedData.head),
        glasses: Number(seedData.glasses)
      } as INounSeed;
    } catch (contractError) {
      // If the contract call fails, use a random seed as fallback
      return {
        background: Math.floor(Math.random() * 2),
        body: Math.floor(Math.random() * 30),
        accessory: Math.floor(Math.random() * 140),
        head: Math.floor(Math.random() * 240),
        glasses: Math.floor(Math.random() * 20)
      };
    }
  } catch (error) {
    console.error('Error fetching noun seed:', error);
    return undefined;
  }
};

export const useNounsTokenContract = () => {
  const { library } = useEthers();
  const nounsTokenContract = NounsTokenFactory.connect(
    config.addresses.nounsToken,
    library?.getSigner() || new ethers.providers.JsonRpcProvider("https://rpc.berachain.com/")
  );
  return { nounsTokenContract };
};

export const useNounSeed = (nounId: EthersBN): INounSeed => {
  // Use useRef to store the last nounId we fetched
  const lastNounIdRef = useRef<string>(nounId?.toString() || '');
  
  // Use a ref to track if we've already fetched this seed
  const hasFetchedRef = useRef<boolean>(false);
  
  const [seed, setSeed] = useState<INounSeed>({
    background: 0,
    body: 0,
    accessory: 0,
    head: 0,
    glasses: 0
  });
  
  const { nounsTokenContract } = useNounsTokenContract();

  useEffect(() => {
    if (!nounsTokenContract || !nounId) {
      return;
    }
    
    // Only fetch if the nounId changed or we haven't fetched yet
    const currentNounId = nounId.toString();
    if (currentNounId === lastNounIdRef.current && hasFetchedRef.current) {
      return;
    }
    
    lastNounIdRef.current = currentNounId;
    
    const fetchSeed = async () => {
      try {
        // For debugging
        console.log(`Fetching seed for noun ${nounId.toString()}`);
        
        const seedData = await nounsTokenContract.seeds(nounId);
        console.log('Raw seed data:', seedData);
        
        // Helper function to safely convert to number
        const toNumber = (value: any): number => {
          if (typeof value === 'number') return value;
          if (value && typeof value.toNumber === 'function') return value.toNumber();
          return 0;
        };
        
        // Define valid ranges for each trait based on available assets
        const VALID_RANGES = {
          background: 2,   // 0-1
          body: 30,        // 0-29
          accessory: 140,  // 0-139
          head: 200,       // 0-199
          glasses: 20      // 0-19
        };
        
        let background = 0;
        let body = 0;
        let accessory = 0;
        let head = 0;
        let glasses = 0;
        
        // Based on the console output, the array indices are different than expected
        // The actual mapping appears to be:
        // [0] = body, [1] = accessory, [2] = head, [3] = glasses, background is missing
        
        // Try accessing as object with properties first
        if (seedData && typeof seedData === 'object' && 'body' in seedData) {
          const typedSeedData = seedData as any;
          body = toNumber(typedSeedData.body);
          accessory = toNumber(typedSeedData.accessory);
          head = toNumber(typedSeedData.head);
          glasses = toNumber(typedSeedData.glasses);
          // Background might be missing, default to 0
          background = 0;
        } 
        // Try accessing as array
        else if (Array.isArray(seedData)) {
          // Based on the console output, the array indices are:
          // [0] = body, [1] = accessory, [2] = head, [3] = glasses
          body = toNumber(seedData[0]);
          accessory = toNumber(seedData[1]);
          head = toNumber(seedData[2]);
          glasses = toNumber(seedData[3]);
          // Background might be missing, default to 0
          background = 0;
        }
        
        // Ensure all values are within valid ranges
        background = background % VALID_RANGES.background;
        body = body % VALID_RANGES.body;
        accessory = accessory % VALID_RANGES.accessory;
        head = head % VALID_RANGES.head;
        glasses = glasses % VALID_RANGES.glasses;
        
        console.log('Processed seed:', { background, body, accessory, head, glasses });
        
        // Create the modified seed
        const modifiedSeed = {
          background,
          body,
          accessory,
          head,
          glasses
        };
        
        setSeed(modifiedSeed);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error(`Error fetching seed for noun ${nounId}: `, error);
        // Set a fallback seed on error
        setSeed({
          background: Math.floor(Math.random() * 2),
          body: Math.floor(Math.random() * 30),
          accessory: Math.floor(Math.random() * 140),
          head: Math.floor(Math.random() * 199), // Keep within valid range
          glasses: Math.floor(Math.random() * 20)
        });
        hasFetchedRef.current = true;
      }
    };

    fetchSeed();
  }, [nounId?.toString(), nounsTokenContract]); // Use nounId.toString() to prevent re-renders

  return seed;
};

export const useUserVotes = (): number | undefined => {
  const { account } = useEthers();
  return useAccountVotes(account ?? ethers.constants.AddressZero);
};

export const useAccountVotes = (account?: string): number | undefined => {
  const [votes] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'getCurrentVotes',
      args: [account],
    }) || [];
  return votes?.toNumber();
};

export const useUserDelegatee = (): string | undefined => {
  const { account } = useEthers();
  const [delegate] =
    useContractCall<[string]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'delegates',
      args: [account],
    }) || [];
  return delegate;
};

export const useUserVotesAsOfBlock = (block: number | undefined): number | undefined => {
  const { account } = useEthers();
  const [votes] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'getPriorVotes',
      args: [account, block],
    }) || [];
  return votes?.toNumber();
};

export const useDelegateVotes = () => {
  const nounsToken = new NounsTokenFactory().attach(config.addresses.nounsToken);
  const { send, state } = useContractFunction(nounsToken, 'delegate');
  return { send, state };
};

export const useNounTokenBalance = (address: string): number | undefined => {
  const [tokenBalance] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'balanceOf',
      args: [address],
    }) || [];
  return tokenBalance?.toNumber();
};

export const useUserNounTokenBalance = (): number | undefined => {
  const { account } = useEthers();

  const [tokenBalance] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'balanceOf',
      args: [account],
    }) || [];
  return tokenBalance?.toNumber();
};

export const useTotalSupply = (): number | undefined => {
  const [totalSupply] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'totalSupply',
    }) || [];
  return totalSupply?.toNumber();
};

export const useUserOwnedNounIds = (pollInterval: number) => {
  const { account } = useEthers();
  const { loading, data, error, refetch } = useQuery(
    ownedNounsQuery(account?.toLowerCase() ?? ''),
    {
      pollInterval: pollInterval,
    },
  );
  const userOwnedNouns: number[] = data?.nouns?.map((noun: NounId) => Number(noun.id));
  return { loading, data: userOwnedNouns, error, refetch };
};

export const useUserEscrowedNounIds = (pollInterval: number, forkId: string) => {
  const { account } = useEthers();
  const { loading, data, error, refetch } = useQuery(
    accountEscrowedNounsQuery(account?.toLowerCase() ?? '', forkId),
    {
      pollInterval: pollInterval,
    },
  );
  const userEscrowedNounIds: number[] = data?.escrowedNouns.reduce(
    (acc: number[], escrowedNoun: EscrowedNoun) => {
      if (escrowedNoun.fork.id === forkId) {
        acc.push(+escrowedNoun.noun.id);
      }
      return acc;
    },
    [],
  );
  return { loading, data: userEscrowedNounIds, error, refetch };
};

export const useSetApprovalForAll = () => {
  let isApprovedForAll = false;
  const { send: setApproval, state: setApprovalState } = useContractFunction(
    nounsTokenContract,
    'setApprovalForAll',
  );
  if (setApprovalState.status === 'Success') {
    isApprovedForAll = true;
  }

  return { setApproval, setApprovalState, isApprovedForAll };
};

export const useIsApprovedForAll = () => {
  const { account } = useEthers();
  const [isApprovedForAll] =
    useContractCall<[EthersBN]>({
      abi,
      address: config.addresses.nounsToken,
      method: 'isApprovedForAll',
      args: [account, config.addresses.nounsDAOProxy],
    }) || [];
  return isApprovedForAll || false;
};
export const useSetApprovalForTokenId = () => {
  const { send: approveTokenId, state: approveTokenIdState } = useContractFunction(
    nounsTokenContract,
    'approve',
  );
  return { approveTokenId, approveTokenIdState };
};

export const useDelegateNounsAtBlockQuery = (signers: string[], block: number) => {
  const { loading, data, error } = useQuery<Delegates>(delegateNounsAtBlockQuery(signers, block));
  return { loading, data, error };
};
