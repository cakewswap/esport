import BigNumber from 'bignumber.js'
import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { PerformanceStatus, PerformanceTicket, PerformanceTicketClaimData } from 'config/constants/types'
import { PerformanceRoundGraphEntity, PerformanceUserGraphEntity } from 'state/types'
import { multicallv2 } from 'utils/multicall'
import prophesyAbi from 'config/abi/bet.json'
import { NUM_ROUNDS_TO_CHECK_FOR_REWARDS } from 'config/constants/lottery'
import { getBetAddress } from 'utils/addressHelpers'
import { BIG_ZERO } from 'utils/bigNumber'
import { fetchUserTicketsForMultipleRounds } from './getUserTicketsData'
import { MAX_LOTTERIES_REQUEST_SIZE } from './getPerformancesData'

interface RoundDataAndUserTickets {
  performanceId: string
  userTickets: PerformanceTicket[]
  finalBet: string
}

const fetchGDERewardsForTickets = async (
  winningTickets: PerformanceTicket[],
  chainId?: number,
): Promise<{ ticketsWithUnclaimedRewards: PerformanceTicket[]; gdeTotal: BigNumber }> => {
  const prophesyAddress = getBetAddress(chainId)

  const calls = winningTickets.map((winningTicket) => {
    const { performanceId, id } = winningTicket
    return {
      name: 'viewRewardsForProphecyId',
      address: prophesyAddress,
      params: [performanceId, id],
    }
  })

  try {
    const GDERewards = await multicallv2({ abi: prophesyAbi, calls, chainId })

    const gdeTotal = GDERewards.reduce((accum: BigNumber, GDEReward: EthersBigNumber[]) => {
      return accum.plus(new BigNumber(GDEReward[0].toString()))
    }, BIG_ZERO)

    const ticketsWithUnclaimedRewards = winningTickets.map((winningTicket, index) => {
      return { ...winningTicket, GDEReward: GDERewards[index] }
    })
    return { ticketsWithUnclaimedRewards, gdeTotal }
  } catch (error) {
    console.error(error)
    return { ticketsWithUnclaimedRewards: null, gdeTotal: null }
  }
}

const getRewardBracketByNumber = (ticketNumber: string, finalBet: string): number => {
  // Winning numbers are evaluated right-to-left in the smart contract, so we reverse their order for validation here:
  // i.e. '1123456' should be evaluated as '6543211'
  const ticketNumAsArray = ticketNumber.split('').reverse()
  const winningNumsAsArray = finalBet.split('').reverse()
  const matchingNumbers = []

  // The number at index 6 in all tickets is 1 and will always match, so finish at index 5
  for (let index = 0; index < winningNumsAsArray.length - 1; index++) {
    if (ticketNumAsArray[index] !== winningNumsAsArray[index]) {
      break
    }
    matchingNumbers.push(ticketNumAsArray[index])
  }

  // Reward brackets refer to indexes, 0 = 1 match, 5 = 6 matches. Deduct 1 from matchingNumbers' length to get the reward bracket
  const rewardBracket = matchingNumbers.length - 1
  return rewardBracket
}

export const getWinningTickets = async (
  roundDataAndUserTickets: RoundDataAndUserTickets,
  chainId?: number,
): Promise<PerformanceTicketClaimData> => {
  const { performanceId, userTickets, finalBet } = roundDataAndUserTickets

  const ticketsWithRewardBrackets = userTickets.map((ticket) => {
    return {
      performanceId,
      id: ticket.id,
      number: ticket.number,
      status: ticket.status,
      won: ticket.number === finalBet,
    }
  })

  // A won of -1 means no matches. 0 and above means there has been a match
  const allWinningTickets = ticketsWithRewardBrackets.filter((ticket) => ticket.won)

  // If ticket.status is true, the ticket has already been claimed
  const unclaimedWinningTickets = allWinningTickets.filter((ticket) => !ticket.status)

  if (unclaimedWinningTickets.length > 0) {
    const { ticketsWithUnclaimedRewards, gdeTotal } = await fetchGDERewardsForTickets(unclaimedWinningTickets, chainId)

    return { ticketsWithUnclaimedRewards, allWinningTickets, gdeTotal, performanceId }
  }

  if (allWinningTickets.length > 0) {
    return { ticketsWithUnclaimedRewards: null, allWinningTickets, gdeTotal: null, performanceId }
  }

  return null
}

const getWinningNumbersForRound = (targetRoundId: string, performancesData: PerformanceRoundGraphEntity[]) => {
  const targetRound = performancesData.find((pastPerformance) => pastPerformance.performanceId === targetRoundId)
  return targetRound?.finalBet?.toString()
}

const fetchUnclaimedUserRewards = async (
  account: string,
  userPerformanceData: PerformanceUserGraphEntity,
  performancesData: PerformanceRoundGraphEntity[],
  currentPerformanceId: string,
  chainId?: number,
): Promise<PerformanceTicketClaimData[]> => {
  const { performances } = userPerformanceData as any
  // If there is no user round history - return an empty array
  if (performances.length === 0) {
    return []
  }

  // If the web3 provider account doesn't equal the userPerformanceData account, return an empty array - this is effectively a loading state as the user switches accounts
  if (userPerformanceData.account.toLowerCase() !== account.toLowerCase()) {
    return []
  }

  // Filter out rounds without subgraph data (i.e. >100 rounds ago)
  const roundsInRange = performances.filter((round) => {
    const lastCheckableRoundId = parseInt(currentPerformanceId, 10) - MAX_LOTTERIES_REQUEST_SIZE
    const roundId = parseInt(round.performanceId, 10)
    return roundId >= lastCheckableRoundId
  })

  // Filter out non-claimable rounds
  const claimableRounds = roundsInRange.filter((round) => {
    return round.status.toLowerCase() === PerformanceStatus.CLAIMABLE
  })

  // Rounds with no tickets claimed OR rounds where a user has over 100 tickets, could have prizes
  const roundsWithPossibleWinnings = claimableRounds.filter((round) => {
    return !round.claimed || parseInt(round.totalTickets, 10) > 100
  })

  // Check the X  most recent rounds, where X is NUM_ROUNDS_TO_CHECK_FOR_REWARDS
  const roundsToCheck = roundsWithPossibleWinnings.slice(0, NUM_ROUNDS_TO_CHECK_FOR_REWARDS)

  if (roundsToCheck.length > 0) {
    const idsToCheck = roundsToCheck.map((round) => round.performanceId)
    const userTicketData = await fetchUserTicketsForMultipleRounds(idsToCheck, account)
    const roundsWithTickets = userTicketData.filter((roundData) => roundData?.userTickets?.length > 0)

    const roundDataAndWinningTickets = roundsWithTickets.map((roundData) => {
      return { ...roundData, finalBet: getWinningNumbersForRound(roundData.performanceId, performancesData) }
    })

    const winningTicketsForPastRounds = await Promise.all(
      roundDataAndWinningTickets.map((roundData) => getWinningTickets(roundData, chainId)),
    )

    // Filter out null values (returned when no winning tickets found for past round)
    const roundsWithWinningTickets = winningTicketsForPastRounds.filter(
      (winningTicketData) => winningTicketData !== null,
    )

    // Filter to only rounds with unclaimed tickets
    const roundsWithUnclaimedWinningTickets = roundsWithWinningTickets.filter(
      (winningTicketData) => winningTicketData.ticketsWithUnclaimedRewards && winningTicketData.gdeTotal.gt(0),
    )

    return roundsWithUnclaimedWinningTickets
  }
  // All rounds claimed, return empty array
  return []
}

export default fetchUnclaimedUserRewards
