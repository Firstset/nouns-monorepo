import { Col, Row } from 'react-bootstrap';
import Section from '../../layout/Section';
import { useAllProposals, useProposalThreshold } from '../../wrappers/nounsDao';
import Proposals from '../../components/Proposals';
import classes from './Governance.module.css';
import { utils } from 'ethers/lib/ethers';
// import clsx from 'clsx';
import { useTreasuryBalance } from '../../hooks/useTreasuryBalance';
import { Trans } from '@lingui/macro';
import { i18n } from '@lingui/core';

const GovernancePage = () => {
  const { data: proposals } = useAllProposals();
  const threshold = useProposalThreshold();
  const nounsRequired = threshold !== undefined ? threshold + 1 : undefined;

  const treasuryBalance = useTreasuryBalance();
  // const treasuryBalanceUSD = useTreasuryUSDValue();

  // // Note: We have to extract this copy out of the <span> otherwise the Lingui macro gets confused
  const subHeading = (
    <Trans>
      Bouns govern <span className={classes.boldText}>Bouns DAO</span>. Bouns can vote on proposals
      or delegate their vote to a third party.
    </Trans>
  );

  return (
    <>
      <Section fullWidth={false} className={classes.section} style={{backgroundColor: 'transparent'}}>
        <Col lg={10} className={classes.wrapper}>
          <Row className={classes.headerRow}>
            <span>
              <Trans>Governance</Trans>
            </span>
            <h1>
              <Trans>Bouns DAO</Trans>
            </h1>
          </Row>
          <p className={classes.subheading}>{subHeading}</p>

          <Row className={classes.treasuryInfoCard}>
            <Col lg={4} className={classes.treasuryAmtWrapper}>
              <Row className={classes.headerRow}>
                <span>
                  <Trans>Treasury</Trans>
                </span>
              </Row>
              <Row>
              <h1>
                    {treasuryBalance &&
                      i18n.number(Number(Number(utils.formatEther(treasuryBalance)).toFixed(2)))}
                      {' '}<small style={{fontSize: '20px'}}>BERA</small>
                  </h1>
                {/* <Col className={classes.usdTreasuryAmt}>
                  <h1 className={classes.usdBalance}>
                    {treasuryBalanceUSD &&
                      i18n.number(Number(treasuryBalanceUSD.toFixed(0)), {
                        style: 'currency',
                        currency: 'USD',
                      })}
                  </h1>
                </Col> */}
              </Row>
            </Col>
            <Col className={classes.treasuryInfoText}>
              <Trans>
                This treasury exists for <span className={classes.boldText}>Bouns DAO</span>{' '}
                participants to allocate resources for the long-term growth and prosperity of the
                Nouns project.
              </Trans>
            </Col>
          </Row>
        </Col>
      </Section>

      <Proposals proposals={proposals} nounsRequired={nounsRequired} />
    </>
  );
};
export default GovernancePage;
