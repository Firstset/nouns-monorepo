import { task, types } from 'hardhat/config';
import ImageData from '../files/image-data-v3-quantized.json';
import { dataToDescriptorInput } from './utils';

task('populate-descriptor', 'Populates the descriptor with color palettes and Noun parts')
  .addOptionalParam(
    'nftDescriptor',
    'The `NFTDescriptorV2` contract address',
    '0x10Bb96b5aAf9C8af610ac1585E6b5e8fd6ab8a9D',
    types.string,
  )
  .addOptionalParam(
    'nounsDescriptor',
    'The `NounsDescriptorV2` contract address',
    '0xd070a97B2c752fF1606D51F214CE06227516a96f',
    types.string,
  )
  .setAction(async ({ nftDescriptor, nounsDescriptor }, { ethers, network }) => {
    //const options = { gasLimit: network.name === 'hardhat' ? 30000000 : undefined };
    const options = { gasLimit: network.name === 'hardhat' ? 30000000 : 30000000 };

    console.log('Populating descriptor...');

    const descriptorFactory = await ethers.getContractFactory('NounsDescriptorV2', {
      libraries: {
        NFTDescriptorV2: nftDescriptor,
      },
    });

    console.log('Descriptor factory created');

    const descriptorContract = descriptorFactory.attach(nounsDescriptor);

    console.log('Descriptor contract attached');

    const { bgcolors, palette, images } = ImageData;
    const { bodies, accessories, heads, glasses } = images;

    console.log('Image data extracted');

    const bodiesPage = dataToDescriptorInput(bodies.map(({ data }) => data));
    const headsPage = dataToDescriptorInput(heads.map(({ data }) => data));
    const glassesPage = dataToDescriptorInput(glasses.map(({ data }) => data));
    const accessoriesPage = dataToDescriptorInput(accessories.map(({ data }) => data));

    console.log('Data to descriptor input extracted');

    // await descriptorContract.addManyBackgrounds(bgcolors);
    await descriptorContract.setPalette(0, `0x000000${palette.join('')}`);

    console.log('Palette set');

    await descriptorContract.addBodies(
      bodiesPage.encodedCompressed,
      bodiesPage.originalLength,
      bodiesPage.itemCount,
      options,
    );
    await descriptorContract.addHeads(
      headsPage.encodedCompressed,
      headsPage.originalLength,
      headsPage.itemCount,
      options,
    );
    await descriptorContract.addGlasses(
      glassesPage.encodedCompressed,
      glassesPage.originalLength,
      glassesPage.itemCount,
      options,
    );
    await descriptorContract.addAccessories(
      accessoriesPage.encodedCompressed,
      accessoriesPage.originalLength,
      accessoriesPage.itemCount,
      options,
    );

    console.log('Descriptor populated with palettes and parts.');
  });
