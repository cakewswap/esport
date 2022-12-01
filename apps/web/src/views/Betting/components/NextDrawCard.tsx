import styled from 'styled-components'
import {
  Card,
  CardHeader,
  CardBody,
  Flex,
  Heading,
  Text,
  Skeleton,
  Button,
  useModal,
  Box,
  Balance,
  ExpandableLabel,
} from '@pancakeswap/uikit'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useWeb3React } from '@pancakeswap/wagmi'
import { PerformanceStatus } from 'config/constants/types'
import { useTranslation } from '@pancakeswap/localization'
import { processViewPerformanceOpen } from 'state/bet/helpers'
import { fetchUserProphecyAndPerformance, selectPerformance } from 'state/bet'
import ViewTicketsModal from './ViewTicketsModal'
import BuyTicketsButton from './BuyTicketsButton'
import { usePerformance } from '../../../state/bet/hooks'
import { Performance } from './Performance'

const Grid = styled.div`
  display: grid;
  grid-template-columns: auto;

  ${({ theme }) => theme.mediaQueries.md} {
    grid-column-gap: 32px;
    grid-template-columns: auto 1fr;
  }
`

const StyledCard = styled(Card)`
  width: 100%;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: 520px;
  }

  ${({ theme }) => theme.mediaQueries.md} {
    width: 756px;
  }
`

const NextDrawCard = () => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const { account } = useWeb3React()
  const dispatch = useDispatch()
  const [moreLive, setMoreLive] = useState<boolean>(false)
  const [morePassed, setMorePassed] = useState<boolean>(false)
  const { performancesData, isTransitioning, currentPerformance } = usePerformance()
  const { userTickets, status, performanceId } = currentPerformance || {}

  const [onPresentViewTicketsModal] = useModal(
    <ViewTicketsModal performanceId={currentPerformance.performanceId} roundStatus={status} />,
  )
  const ticketBuyIsDisabled = !processViewPerformanceOpen(currentPerformance) || isTransitioning

  const isPerformanceOpen = status !== PerformanceStatus.PENDING
  const userTicketCount = userTickets?.tickets?.length || 0

  const ticketRoundText =
    userTicketCount > 1
      ? t('You have %amount% tickets in betting', { amount: userTicketCount })
      : t('You have %amount% ticket in betting', { amount: userTicketCount })
  const [youHaveText, ticketsThisRoundText] = ticketRoundText.split(userTicketCount.toString())

  const [performancesNext, performancesHisory] = (performancesData || [])?.reduce(
    (obj, item) => {
      obj[item.status === PerformanceStatus.OPEN ? 0 : 1].push(item)

      return obj
    },
    [[], []],
  )

  return (
    <>
      <StyledCard>
        <CardHeader p="16px 24px">
          <Flex justifyContent="space-between">
            <Heading mr="12px">{t('Next Matches')}</Heading>
          </Flex>
        </CardHeader>
        <CardBody>
          <Grid>
            <Flex justifyContent={['center', null, null, 'flex-start']}>
              <Heading>{t('Matches')}:</Heading>
            </Flex>
            <Flex flexDirection="column" mb="20px">
              <Flex flexDirection="row" flexWrap="wrap" mb="20px">
                {performancesNext?.slice(0, moreLive ? performancesNext.length : 4).map((item) => (
                  <Flex p="5px" width={['100%', '100%', '50%', '50%']}>
                    <Performance
                      key={item.performanceId}
                      performance={item}
                      onClick={() => {
                        dispatch(selectPerformance({ performanceId: item.performanceId }) as any)
                        dispatch(fetchUserProphecyAndPerformance({ account, performanceId: item.performanceId }) as any)
                      }}
                      activated={item.performanceId === performanceId}
                    />
                  </Flex>
                ))}
              </Flex>
              {performancesNext?.length > 4 && (
                <ExpandableLabel expanded={moreLive} onClick={() => setMoreLive(!moreLive)}>
                  {moreLive ? t('Hide') : t('More')}
                </ExpandableLabel>
              )}
            </Flex>
            <Box display={['none', null, null, 'flex']}>
              <Heading>{t('Your tickets')}</Heading>
            </Box>
            <Flex flexDirection="column" alignItems={['center', null, null, 'flex-start']} mb="20px">
              {isPerformanceOpen && (
                <Flex
                  flexDirection="column"
                  mr={[null, null, null, '24px']}
                  alignItems={['center', null, null, 'flex-start']}
                >
                  {account && (
                    <Flex justifyContent={['center', null, null, 'flex-start']}>
                      <Text display="inline">{youHaveText} </Text>
                      {!userTickets?.isLoading ? (
                        <Balance value={userTicketCount} decimals={0} display="inline" bold mx="4px" />
                      ) : (
                        <Skeleton mx="4px" height={20} width={40} />
                      )}
                      <Text display="inline"> {ticketsThisRoundText}</Text>
                    </Flex>
                  )}
                  {!userTickets?.isLoading && userTicketCount > 0 && (
                    <Button
                      onClick={onPresentViewTicketsModal}
                      height="auto"
                      width="fit-content"
                      p="0"
                      my="10px"
                      mb={['10px', null, null, '10px']}
                      variant="text"
                      scale="sm"
                    >
                      {t('View your tickets')}
                    </Button>
                  )}
                </Flex>
              )}
              <div>
                <BuyTicketsButton disabled={ticketBuyIsDisabled} maxWidth="280px" />
              </div>
            </Flex>
          </Grid>
        </CardBody>
      </StyledCard>
      <StyledCard mt="30px">
        <CardHeader p="16px 24px">
          <Flex justifyContent="space-between">
            <Heading mr="12px">{t('Over Matches')}</Heading>
          </Flex>
        </CardHeader>
        <CardBody>
          <Grid>
            <Flex flexDirection="column">
              <Flex flexDirection="row" flexWrap="wrap" mb="20px">
                {performancesHisory?.reverse().map((item) => (
                  <Flex p="5px" width={['100%', '100%', '50%', '50%']}>
                    <Performance
                      passed
                      key={item.performanceId}
                      performance={item}
                      onClick={() => {
                        dispatch(selectPerformance({ performanceId: item.performanceId }) as any)
                        dispatch(fetchUserProphecyAndPerformance({ account, performanceId: item.performanceId }) as any)
                      }}
                      activated={item.performanceId === performanceId}
                    />
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Grid>
        </CardBody>
      </StyledCard>
    </>
  )
}

export default NextDrawCard
