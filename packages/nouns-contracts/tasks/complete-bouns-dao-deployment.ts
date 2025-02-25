import { task, types } from 'hardhat/config';

task(
  'complete-bouns-dao-deployment',
  'Complete the Bouns DAO deployment after populate-descriptor stage',
)
  .addFlag('startAuction', 'Start the first auction upon deployment completion')
  .addParam('executorAddress', 'The NounsDAOExecutorProxy address', '0x8cb4a504ECD256BdbdDdEdBb9Fe7fD56e2A736F6', types.string)
  .addParam('descriptorAddress', 'The NounsDescriptorV2 address', '0x40708b4142CD676bE964440152eA3189F81f9b92', types.string)
  .addParam('tokenAddress', 'The NounsToken address', '0x9705B30bc0780b875063881E964EC5143f1549f4', types.string)
  .addParam('proxyAdminAddress', 'The NounsAuctionHouseProxyAdmin address', '0xf3576b6AAEF781E2ABc61BcF627e64AC24D77Bd6', types.string)
  .addParam('auctionHouseAddress', 'The NounsAuctionHouse address', '0x43e606D852b77D9b8699C2E7A07193114f0cE90a', types.string)
  .addParam('auctionHouseProxyAddress', 'The NounsAuctionHouseProxy address', '0x4A749163D23FB7a64d5C7883028857b26CD3143E', types.string)
  .addParam('nftDescriptorAddress', 'The NFTDescriptorV2 library address', '0x796d2dB26DbE102FE473DeE0BE9C558431D66b5d', types.string)
  .setAction(async (args, { ethers }) => {
    console.log('Completing Bouns DAO deployment...');

    // Create contract instances
    console.log('Creating contract factory instances...');
    
    // Create the NounsDescriptorV2 factory with the linked library
    const descriptorFactory = await ethers.getContractFactory('NounsDescriptorV2', {
      libraries: {
        NFTDescriptorV2: args.nftDescriptorAddress,
      },
    });
    
    const tokenFactory = await ethers.getContractFactory('NounsToken');
    const proxyAdminFactory = await ethers.getContractFactory('NounsAuctionHouseProxyAdmin');
    const auctionHouseFactory = await ethers.getContractFactory('NounsAuctionHouse');
    console.log('Contract factories created successfully');

    console.log('Attaching to deployed contracts...');
    const descriptor = descriptorFactory.attach(args.descriptorAddress);
    const token = tokenFactory.attach(args.tokenAddress);
    const proxyAdmin = proxyAdminFactory.attach(args.proxyAdminAddress);
    const auctionHouse = auctionHouseFactory.attach(args.auctionHouseAddress);
    const auctionHouseProxy = args.auctionHouseProxyAddress;
    console.log('Successfully attached to all deployed contracts');

    // Transfer ownership of all contracts except for the auction house to the executor
    console.log(`Transferring NounsDescriptorV2 ownership to executor (${args.executorAddress})...`);
    const descriptorTx = await descriptor.transferOwnership(args.executorAddress);
    await descriptorTx.wait();
    console.log(`✅ NounsDescriptorV2 ownership transferred successfully (tx: ${descriptorTx.hash})`);
    
    console.log(`Transferring NounsToken ownership to executor (${args.executorAddress})...`);
    const tokenTx = await token.transferOwnership(args.executorAddress);
    await tokenTx.wait();
    console.log(`✅ NounsToken ownership transferred successfully (tx: ${tokenTx.hash})`);
    
    console.log(`Transferring NounsAuctionHouseProxyAdmin ownership to executor (${args.executorAddress})...`);
    const proxyAdminTx = await proxyAdmin.transferOwnership(args.executorAddress);
    await proxyAdminTx.wait();
    console.log(`✅ NounsAuctionHouseProxyAdmin ownership transferred successfully (tx: ${proxyAdminTx.hash})`);
    
    console.log(
      'Transferred ownership of the descriptor, token, and proxy admin contracts to the executor.',
    );

    // Optionally kick off the first auction and transfer ownership of the auction house
    // to the Nouns DAO executor.
    console.log('Attaching to auction house proxy...');
    const auctionHouseWithProxy = auctionHouse.attach(auctionHouseProxy);
    console.log('Successfully attached to auction house proxy');
    
    if (args.startAuction) {
      console.log('Starting the first auction (unpausing the auction house)...');
      const unpauseTx = await auctionHouseWithProxy.unpause({
        gasLimit: 1_000_000,
      });
      await unpauseTx.wait();
      console.log(`✅ First auction started successfully (tx: ${unpauseTx.hash})`);

      console.log(`Transferring NounsAuctionHouse ownership to executor (${args.executorAddress})...`);
      const auctionHouseTx = await auctionHouseWithProxy.transferOwnership(args.executorAddress);
      await auctionHouseTx.wait();
      console.log(`✅ NounsAuctionHouse ownership transferred successfully (tx: ${auctionHouseTx.hash})`);
      
      console.log('Transferred ownership of the auction house to the executor.');
    } else {
      console.log('Skipping auction start (--startAuction flag not provided)');
    }

    console.log('\n📄 Contract addresses:');
    console.log('NounsDAOExecutorProxy:', args.executorAddress);
    console.log('NounsDescriptorV2:', args.descriptorAddress);
    console.log('NounsToken:', args.tokenAddress);
    console.log('NounsAuctionHouseProxyAdmin:', args.proxyAdminAddress);
    console.log('NounsAuctionHouse:', args.auctionHouseAddress);
    console.log('NounsAuctionHouseProxy:', auctionHouseProxy);
    console.log('NFTDescriptorV2 (library):', args.nftDescriptorAddress);
    
    console.log('\n🎉 Deployment completion successful!');
  }); 