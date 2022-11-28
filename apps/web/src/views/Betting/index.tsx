import { useState } from 'react'
import styled from 'styled-components'
import { Box, Flex, Heading, Skeleton } from '@pancakeswap/uikit'
import { PerformanceStatus } from 'config/constants/types'
import PageSection from 'components/PageSection'
import { useTranslation } from '@pancakeswap/localization'
import useTheme from 'hooks/useTheme'
import { useFetchPerformances, usePerformance } from 'state/bet/hooks'
import { TITLE_BG, GET_TICKETS_BG } from './pageSectionStyles'
import useStatusTransitions from './hooks/useStatusTransitions'
import Hero from './components/Hero'
import NextDrawCard from './components/NextDrawCard'
import HowToPlay from './components/HowToPlay'
import { PageMeta } from '../../components/Layout/Page'

const BetPage = styled.div`
  min-height: calc(100vh - 64px);
`

const Bet = () => {
  useFetchPerformances()
  useStatusTransitions()
  const { t } = useTranslation()
  const { isDark, theme } = useTheme()
  const {
    currentPerformance: { status, endTime },
  } = usePerformance()

  return (
    <>
      <PageMeta />
      <BetPage>
        <PageSection background={TITLE_BG} index={1} hasCurvedDivider={false}>
          <Hero />
        </PageSection>
        <PageSection
          containerProps={{ style: { marginTop: '-30px' } }}
          background={GET_TICKETS_BG}
          concaveDivider
          clipFill={{ light: '#8A1538' }}
          dividerPosition="top"
          index={2}
        >
          <Flex alignItems="center" justifyContent="center" flexDirection="column" pt="24px">
            {status === PerformanceStatus.OPEN && (
              <Heading scale="xl" color="#ffffff" mb="24px" textAlign="center">
                {t('Get your bet now!')}
              </Heading>
            )}
            <NextDrawCard />
          </Flex>
        </PageSection>
        <PageSection
          dividerPosition="top"
          dividerFill={{ light: theme.colors.background }}
          clipFill={{ light: '#8A1538', dark: '#66578D' }}
          index={2}
        >
          <HowToPlay />
        </PageSection>
      </BetPage>
    </>
  )
}

export default Bet
