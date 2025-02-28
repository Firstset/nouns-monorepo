import { ImageData as data, getNounData } from '@nouns/assets';
import { buildSVG } from '@nouns/sdk';
import { INounSeed } from '../../wrappers/nounToken';
import React from 'react';
import classes from './NounImage.module.css';

interface NounImageProps {
  seed: INounSeed;
  className?: string;
}

const NounImage: React.FC<NounImageProps> = ({ seed, className }) => {
  if (!seed) {
    return null;
  }

  const { parts } = getNounData(seed);
  const svg = buildSVG(parts, data.palette);
  const image = `data:image/svg+xml;base64,${btoa(svg)}`;

  return (
    <img 
      src={image} 
      alt={`Boun with head #${seed.head}`} 
      className={className || classes.nounImage} 
    />
  );
};

export default NounImage; 