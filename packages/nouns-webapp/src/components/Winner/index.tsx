import { Row, Col } from 'react-bootstrap';
import { useAppSelector } from '../../hooks';
import classes from './Winner.module.css';
import ShortAddress from '../ShortAddress';
import clsx from 'clsx';
import { Trans } from '@lingui/macro';
import { useActiveLocale } from '../../hooks/useActivateLocale';
import React from 'react';
import { buildEtherscanAddressLink } from '../../utils/etherscan';
import Tooltip from '../Tooltip';

interface WinnerProps {
  winner: string;
  isNounders?: boolean;
}

const Winner: React.FC<WinnerProps> = props => {
  const { winner, isNounders } = props;
  const activeAccount = useAppSelector(state => state.account.activeAccount);

  const isWinnerYou =
    activeAccount !== undefined && activeAccount.toLocaleLowerCase() === winner.toLocaleLowerCase();

  const activeLocale = useActiveLocale();

  const nonNounderNounContent = isWinnerYou ? (
    <Row className={classes.youSection}>
      <Col lg={activeLocale === 'ja-JP' ? 8 : 4} className={classes.youCopy}>
        <h2
          className={classes.winnerContent}
        >
          <Trans>You</Trans>
        </h2>
      </Col>
    </Row>
  ) : (
    <ShortAddress size={40} address={winner} avatar={true} />
  );

  const nounderNounContent = (
    <a
      href={buildEtherscanAddressLink('0x1a90FBb6Eb1f8d43d94F595C99Df7a5081e47909')}
      target={'_blank'}
      rel="noreferrer"
      className={classes.link}
    >
      <Tooltip
        tip="View on Berascan"
        tooltipContent={(tip: string) => {
          return <Trans>View on Berascan</Trans>;
        }}
        id="holder-etherscan-tooltip"
      >
        Bounders
      </Tooltip>
    </a>
  );

  return (
    <>
      <Row className={clsx(classes.wrapper, classes.section)}>
        <Col xs={1} lg={12} className={classes.leftCol}>
          <h4 className={classes.winnerCopy}>
            <Trans>Winner</Trans>
          </h4>
        </Col>
        <Col xs="auto" lg={12}>
          <h2
            className={classes.winnerContent}
          >
            {isNounders ? nounderNounContent : nonNounderNounContent}
          </h2>
        </Col>
      </Row>
    </>
  );
};

export default Winner;
