import { TICKET_LIMIT_PER_REQUEST } from 'config/constants/lottery'
import { PerformanceTicket } from 'config/constants/types'
import { getBetContract } from 'utils/contractHelpers'

const betContract = getBetContract()

export const processRawTicketsResponse = (
  ticketsResponse: Awaited<ReturnType<any['viewUserInfoForPerformanceId']>>,
): PerformanceTicket[] => {
  const [ticketIds, ticketNumbers, ticketStatuses] = ticketsResponse

  if (ticketIds?.length > 0) {
    return ticketIds.map((ticketId, index) => {
      return {
        id: ticketId.toString(),
        number: ticketNumbers[index].toString(),
        status: ticketStatuses[index],
      }
    })
  }
  return []
}

export const viewUserInfoForPerformanceId = async (
  account: string,
  performanceId: string,
  cursor: number,
  perRequestLimit: number,
): Promise<PerformanceTicket[]> => {
  try {
    const data = await betContract.viewUserInfoForPerformanceId(account, performanceId, cursor, perRequestLimit)
    return processRawTicketsResponse(data)
  } catch (error) {
    console.error('viewUserInfoForPerformanceId', error)
    return null
  }
}

export const fetchUserTicketsForOneRound = async (
  account: string,
  performanceId: string,
): Promise<PerformanceTicket[]> => {
  let cursor = 0
  let numReturned = TICKET_LIMIT_PER_REQUEST
  const ticketData = []

  while (numReturned === TICKET_LIMIT_PER_REQUEST) {
    // eslint-disable-next-line no-await-in-loop
    const response = await viewUserInfoForPerformanceId(account, performanceId, cursor, TICKET_LIMIT_PER_REQUEST)
    cursor += TICKET_LIMIT_PER_REQUEST
    numReturned = response.length
    ticketData.push(...response)
  }

  return ticketData
}

export const fetchUserTicketsForMultipleRounds = async (
  idsToCheck: string[],
  account: string,
): Promise<{ performanceId: string; userTickets: PerformanceTicket[] }[]> => {
  const results = await Promise.all(
    idsToCheck.map((performanceId) =>
      Promise.all([Promise.resolve(performanceId), fetchUserTicketsForOneRound(account, performanceId)]),
    ),
  )

  return results.map(([performanceId, ticketsForPerformance]) => ({
    performanceId,
    userTickets: ticketsForPerformance,
  }))
}
