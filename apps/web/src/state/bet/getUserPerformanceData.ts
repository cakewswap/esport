import { request, gql } from 'graphql-request'
import { GRAPH_API_LOTTERY } from 'config/constants/endpoints'
import { PerformanceTicket } from 'config/constants/types'
import { PerformanceUserGraphEntity, ProphesyResponse, UserPerformance } from 'state/types'
import { getRoundIdsArray, fetchMultiplePerformances, hasRoundBeenClaimed } from './helpers'
import { fetchUserTicketsForMultipleRounds } from './getUserTicketsData'

export const MAX_USER_LOTTERIES_REQUEST_SIZE = 100

/* eslint-disable camelcase */
type UserLotteriesWhere = { lottery_in?: string[] }

const applyNodeDataToUserGraphResponse = (
  userNodeData: { performanceId: string; userTickets: PerformanceTicket[] }[],
  performanceNodeData: ProphesyResponse[],
): UserPerformance[] => {
  //   If no graph rounds response - return node data
  return performanceNodeData.map((nodeRound) => {
    const ticketDataForRound = userNodeData.find(
      (roundTickets) => roundTickets.performanceId === nodeRound.performanceId,
    )

    return {
      endTime: nodeRound.endTime,
      status: nodeRound.status,
      performanceId: nodeRound.performanceId.toString(),
      claimed: hasRoundBeenClaimed(ticketDataForRound.userTickets),
      totalTickets: `${ticketDataForRound.userTickets.length.toString()}`,
      tickets: ticketDataForRound.userTickets,
    }
  })
}

export const getGraphLotteryUser = async (
  account: string,
  first = MAX_USER_LOTTERIES_REQUEST_SIZE,
  skip = 0,
  where: UserLotteriesWhere = {},
): Promise<PerformanceUserGraphEntity> => {
  let user
  const blankUser = {
    account,
    totalCake: '',
    totalTickets: '',
    rounds: [],
  }

  try {
    const response = await request(
      GRAPH_API_LOTTERY,
      gql`
        query getUserLotteries($account: ID!, $first: Int!, $skip: Int!, $where: Round_filter) {
          user(id: $account) {
            id
            totalTickets
            totalCake
            rounds(first: $first, skip: $skip, where: $where, orderDirection: desc, orderBy: block) {
              id
              lottery {
                id
                endTime
                status
              }
              claimed
              totalTickets
            }
          }
        }
      `,
      { account: account.toLowerCase(), first, skip, where },
    )
    const userRes = response.user

    // If no user returned - return blank user
    if (!userRes) {
      user = blankUser
    } else {
      user = {
        account: userRes.id,
        totalCake: userRes.totalCake,
        totalTickets: userRes.totalTickets,
        rounds: userRes.rounds.map((round) => {
          return {
            lotteryId: round?.lottery?.id,
            endTime: round?.lottery?.endTime,
            claimed: round?.claimed,
            totalTickets: round?.totalTickets,
            status: round?.lottery?.status.toLowerCase(),
          }
        }),
      }
    }
  } catch (error) {
    console.error(error)
    user = blankUser
  }

  return user
}

const getUserPerformanceData = async (account: string, performanceId: string): Promise<PerformanceUserGraphEntity> => {
  const idsForTicketsNodeCall = getRoundIdsArray(performanceId, true)
  const roundDataAndUserTickets = await fetchUserTicketsForMultipleRounds(idsForTicketsNodeCall, account)

  const userPerformancesNodeData = roundDataAndUserTickets.filter((round) => round.userTickets.length > 0)

  const idsForPerformanceNodeCall = userPerformancesNodeData.map((round) => round.performanceId)

  const [performancesNodeData] = await Promise.all([fetchMultiplePerformances(idsForPerformanceNodeCall)])

  const mergedPerformanceData = applyNodeDataToUserGraphResponse(userPerformancesNodeData, performancesNodeData)

  return {
    account,
    totalgde: '0',
    totalTickets: mergedPerformanceData.length.toString(),
    performances: mergedPerformanceData,
  }
}

export default getUserPerformanceData
