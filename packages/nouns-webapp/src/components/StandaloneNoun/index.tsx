import { ImageData as data, getNounData } from '@nouns/assets';
import { buildSVG } from '@nouns/sdk';
import { BigNumber as EthersBN } from 'ethers';
import { INounSeed, useNounSeed } from '../../wrappers/nounToken';
import Noun from '../Noun';
import { Link } from 'react-router-dom';
import classes from './StandaloneNoun.module.css';
import { useDispatch } from 'react-redux';
import { setOnDisplayAuctionNounId } from '../../state/slices/onDisplayAuction';
import nounClasses from '../Noun/Noun.module.css';
import Image from 'react-bootstrap/Image';
import NounImage from '../NounImage';

interface StandaloneNounProps {
  nounId: EthersBN;
}
interface StandaloneCircularNounProps {
  nounId: EthersBN;
  border?: boolean;
}

interface StandaloneNounWithSeedProps {
  nounId: EthersBN;
  onLoadSeed?: (seed: INounSeed) => void;
  shouldLinkToProfile: boolean;
}

export const getNoun = (nounId: string | EthersBN, seed: INounSeed) => {
  const id = nounId.toString();
  const name = `Boun ${id}`;
  const description = `Boun ${id} is a member of the Bouns DAO`;
  const { parts } = getNounData(seed);
  const image = `data:image/svg+xml;base64,${btoa(buildSVG(parts, data.palette))}`;

  return {
    name,
    description,
    image,
  };
};

export const StandaloneNounImage: React.FC<StandaloneNounProps> = (props: StandaloneNounProps) => {
  const { nounId } = props;
  const seed = useNounSeed(nounId);
  const noun = seed && getNoun(nounId, seed);

  return <Image src={noun ? noun.image : ''} fluid />;
};

const StandaloneNoun: React.FC<StandaloneNounProps> = (props: StandaloneNounProps) => {
  const { nounId } = props;
  const seed = useNounSeed(nounId);
  const noun = seed && getNoun(nounId, seed);

  const dispatch = useDispatch();

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(nounId.toNumber()));
  };

  return (
    <Link
      to={'/boun/' + nounId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Noun imgPath={noun ? noun.image : ''} alt={noun ? noun.description : 'Boun'} />
    </Link>
  );
};

export const StandaloneNounCircular: React.FC<StandaloneCircularNounProps> = (
  props: StandaloneCircularNounProps,
) => {
  const { nounId, border } = props;
  const seed = useNounSeed(nounId);
  const noun = seed && getNoun(nounId, seed);

  const dispatch = useDispatch();
  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(nounId.toNumber()));
  };

  if (!seed || !nounId) return <Noun imgPath="" alt="Boun" wrapperClassName={nounClasses.circularNounWrapper} />;

  return (
    <Link
      to={'/boun/' + nounId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      <Noun
        imgPath={noun ? noun.image : ''}
        alt={noun ? noun.description : 'Noun'}
        wrapperClassName={nounClasses.circularNounWrapper}
        className={border ? nounClasses.circleWithBorder : nounClasses.circular}
      />
    </Link>
  );
};

export const StandaloneNounRoundedCorners: React.FC<{
  nounId: EthersBN;
}> = props => {
  const { nounId } = props;
  const seed = useNounSeed(nounId);
  
  // Ensure head value is within valid range (0-199 or whatever your max is)
  const processedSeed = seed ? {
    ...seed,
    head: seed.head > 199 ? seed.head % 200 : seed.head
  } : undefined;
  
  const noun = processedSeed && getNoun(nounId, processedSeed);
  
  return (
    <div className={classes.standaloneNounWrapper}>
      <div className={classes.standaloneNounRoundedCorners}>
        <Noun 
          imgPath={noun ? noun.image : ''} 
          alt={noun ? noun.description : 'Boun'} 
          className={nounClasses.rounded}
        />
      </div>
    </div>
  );
};

export const StandaloneNounWithSeed: React.FC<StandaloneNounWithSeedProps> = (
  props: StandaloneNounWithSeedProps,
) => {
  const { nounId, onLoadSeed, shouldLinkToProfile } = props;

  const dispatch = useDispatch();
  const seed = useNounSeed(nounId);
  const seedIsInvalid = Object.values(seed || {}).every(v => v === 0);

  if (!seed || seedIsInvalid || !nounId || !onLoadSeed) return <Noun imgPath="" alt="Boun" />;

  onLoadSeed(seed);

  const onClickHandler = () => {
    dispatch(setOnDisplayAuctionNounId(nounId.toNumber()));
  };

  const { image, description } = getNoun(nounId, seed);

  const noun = <Noun imgPath={image} alt={description} />;
  const nounWithLink = (
    <Link
      to={'/boun/' + nounId.toString()}
      className={classes.clickableNoun}
      onClick={onClickHandler}
    >
      {noun}
    </Link>
  );
  return shouldLinkToProfile ? nounWithLink : noun;
};

export default StandaloneNoun;
