import { useEffect, useState } from 'react'
import {
  Box,
  Text,
  Flex,
  Button,
  Skeleton,
  Ticket,
  PresentWonIcon,
  TooltipText,
  InfoIcon,
  useTooltip,
  useModal,
} from '@pancakeswap/uikit'
import styled from 'styled-components'
import { useWeb3React } from '@pancakeswap/wagmi'
import { PerformanceTicket, PerformanceTicketClaimData } from 'config/constants/types'
import { fetchPerformance } from 'state/bet/helpers'
import { getWinningTickets } from 'state/bet/fetchUnclaimedUserRewards'
import { fetchUserTicketsForOneRound } from 'state/bet/getUserTicketsData'
import { PerformanceRound } from 'state/types'
import { useTranslation } from '@pancakeswap/localization'
import useTheme from 'hooks/useTheme'
import orderBy from 'lodash/orderBy'
import WinningNumbers from '../WinningNumbers'
import { processTicketResponse } from '../../helpers'
import TicketNumber from '../TicketNumber'
import ClaimPrizesModal from '../ClaimPrizesModal'

const TopBox = styled(Flex)`
  flex-direction: column;
  margin: -24px;
  padding: 24px;
  background-color: ${({ theme }) => theme.colors.dropdown};
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const ScrollBox = styled(Box)`
  margin-right: -20px;
  padding-right: 24px;
  max-height: 300px;
  overflow-y: scroll;
  margin-top: 24px;
`

const TicketSkeleton = () => {
  return (
    <>
      <Skeleton width="32px" height="12px" mt="2px" mb="4px" />
      <Skeleton width="100%" height="34px" mb="12px" />
    </>
  )
}

const PreviousRoundTicketsInner: React.FC<React.PropsWithChildren<{ performanceId: string }>> = ({ performanceId }) => {
  const [performanceData, setPerformanceInfo] = useState<PerformanceRound>(null)
  const [allUserTickets, setAllUserTickets] = useState<PerformanceTicket[]>(null)
  const [userWinningTickets, setUserWinningTickets] = useState<{
    allWinningTickets: PerformanceTicket[]
    ticketsWithUnclaimedRewards: PerformanceTicket[]
    isFetched: boolean
    claimData: PerformanceTicketClaimData
  }>({ allWinningTickets: null, ticketsWithUnclaimedRewards: null, isFetched: false, claimData: null })
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { account } = useWeb3React()
  const [onPresentClaimModal] = useModal(<ClaimPrizesModal roundsToClaim={[userWinningTickets.claimData]} />, false)

  const TooltipComponent = () => (
    <>
      <Text mb="16px">
        {t('Tickets must match the winning number in the exact same order, starting from the first digit.')}
      </Text>
      <Text mb="16px">{t('If the winning number is “123456”:')}</Text>
      <Text mb="4px">{t('“120000” matches the first 2 digits.')}</Text>
      <Text>
        {t('“000006” matches the last digit, but since the first five digits are wrong, it doesn’t win any prizes.')}
      </Text>
    </>
  )

  const { targetRef, tooltip, tooltipVisible } = useTooltip(<TooltipComponent />, {
    placement: 'bottom-end',
    tooltipOffset: [20, 10],
  })

  useEffect(() => {
    const addWinningTicketInfoToAllTickets = (
      _allTickets: PerformanceTicket[],
      _allWinningTickets: PerformanceTicket[],
    ): PerformanceTicket[] => {
      const allTicketsWithWinningTickets = _allTickets.map((ticket) => {
        const winningTicketEquivalent = _allWinningTickets.find((winningTicket) => winningTicket.id === ticket.id)
        if (winningTicketEquivalent) {
          return winningTicketEquivalent
        }
        return ticket
      })
      return allTicketsWithWinningTickets
    }

    const sortTicketsByWinningBracket = (tickets) => {
      return orderBy(tickets, (ticket) => (ticket.rewardBracket === undefined ? 0 : ticket.rewardBracket + 1), 'desc')
    }

    const fetchData = async () => {
      const [userTickets, perfomanceData] = await Promise.all([
        fetchUserTicketsForOneRound(account, performanceId),
        fetchPerformance(performanceId),
      ])
      const processedPerformanceData = processTicketResponse(perfomanceData)
      const winningTickets = await getWinningTickets({
        performanceId,
        userTickets,
        finalBet: processedPerformanceData.finalBet?.toString(),
      })

      setUserWinningTickets({
        isFetched: true,
        allWinningTickets: winningTickets?.allWinningTickets,
        ticketsWithUnclaimedRewards: winningTickets?.ticketsWithUnclaimedRewards,
        claimData: winningTickets,
      })
      setPerformanceInfo(processedPerformanceData)

      // If the user has some winning tickets - modify the userTickets response to include that data
      if (winningTickets?.allWinningTickets) {
        const allTicketsWithWinningTicketInfo = addWinningTicketInfoToAllTickets(
          userTickets,
          winningTickets.allWinningTickets,
        )
        const ticketsSortedByWinners = sortTicketsByWinningBracket(allTicketsWithWinningTicketInfo)
        setAllUserTickets(ticketsSortedByWinners)
      } else {
        setAllUserTickets(userTickets)
      }
    }

    fetchData()
  }, [performanceId, account])

  const getFooter = () => {
    console.log('userWinningTickets:', userWinningTickets)

    if (userWinningTickets?.ticketsWithUnclaimedRewards?.length > 0) {
      return (
        <Button onClick={onPresentClaimModal} mt="24px" width="100%">
          {t('Collect Prizes')}
        </Button>
      )
    }

    if (!userWinningTickets.allWinningTickets) {
      return (
        <div ref={targetRef}>
          <Flex alignItems="center" justifyContent="center" mt="20px">
            <InfoIcon height="20px" width="20px" color="textSubtle" mr="8px" />
            <TooltipText color="textSubtle">{t("Why didn't I win?")}</TooltipText>
          </Flex>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {tooltipVisible && tooltip}
      <TopBox>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" mb="4px">
          {t('Winning ticket')}
        </Text>
        {performanceData?.finalBet ? (
          <WinningNumbers number={performanceData.finalBet.toString()} />
        ) : (
          <Skeleton width="230px" height="34px" />
        )}
      </TopBox>
      <ScrollBox>
        <Text bold textTransform="uppercase" color="secondary" fontSize="12px" my="16px">
          {t('Your tickets')}
        </Text>
        <Flex mb="8px" justifyContent="space-between">
          <Flex>
            <Ticket width="24px" height="24px" mr="8px" />
            <Text bold color="text">
              {t('Total tickets')}:
            </Text>
          </Flex>
          <Text bold color="text">
            {allUserTickets ? allUserTickets.length : <Skeleton width="56px" height="24px" />}
          </Text>
        </Flex>
        <Flex mb="24px" justifyContent="space-between">
          <Flex>
            <PresentWonIcon width="24px" height="24px" mr="8px" />
            <Text bold color="text">
              {t('Winning tickets')}:
            </Text>
          </Flex>
          <Text bold color="text">
            {userWinningTickets.isFetched ? (
              userWinningTickets?.allWinningTickets?.length || '0'
            ) : (
              <Skeleton width="40px" height="24px" />
            )}
          </Text>
        </Flex>
        {allUserTickets ? (
          allUserTickets.map((ticket) => {
            return (
              <TicketNumber
                key={ticket.id}
                id={ticket.id}
                home={performanceData?.home}
                number={ticket.number}
                status={ticket.status}
              />
            )
          })
        ) : (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        )}
      </ScrollBox>
      <Flex borderTop={`1px solid ${theme.colors.cardBorder}`} alignItems="center" justifyContent="center">
        {userWinningTickets.isFetched && getFooter()}
      </Flex>
    </>
  )
}

export default PreviousRoundTicketsInner
