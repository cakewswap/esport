import { request, gql } from 'graphql-request'
import { GRAPH_API_LOTTERY } from 'config/constants/endpoints'
import { LotteryRoundGraphEntity, PerformanceRoundGraphEntity } from 'state/types'
import { getRoundIdsArray, fetchMultiplePerformances } from './helpers'

export const MAX_LOTTERIES_REQUEST_SIZE = 100

/* eslint-disable camelcase */
type LotteriesWhere = { id_in?: string[] }

export const getGraphLotteries = async (
  first = MAX_LOTTERIES_REQUEST_SIZE,
  skip = 0,
  where: LotteriesWhere = {},
): Promise<LotteryRoundGraphEntity[]> => {
  try {
    const response = await request(
      GRAPH_API_LOTTERY,
      gql`
        query getLotteries($first: Int!, $skip: Int!, $where: Lottery_filter) {
          lotteries(first: $first, skip: $skip, where: $where, orderDirection: desc, orderBy: block) {
            id
            totalUsers
            totalTickets
            winningTickets
            status
            finalNumber
            startTime
            endTime
            ticketPrice
          }
        }
      `,
      { skip, first, where },
    )
    return response.lotteries
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPerformancesData = async (lastProphecyId: string): Promise<PerformanceRoundGraphEntity[]> => {
  const idsForNodesCall = getRoundIdsArray(lastProphecyId)
  const nodeData = await fetchMultiplePerformances(idsForNodesCall)

  return nodeData as any
}

export default getPerformancesData
