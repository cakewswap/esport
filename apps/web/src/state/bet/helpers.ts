import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { PerformanceStatus, LotteryTicket } from 'config/constants/types'
import prophesyAbi from 'config/abi/bet.json'
import { getBetAddress } from 'utils/addressHelpers'
import { multicallv2 } from 'utils/multicall'
import { PerformanceResponse } from 'state/types'
import { getBetContract } from 'utils/contractHelpers'
import { ethersToSerializedBigNumber } from 'utils/bigNumber'

const betContract = getBetContract()

export const processViewPerformanceOpen = (performance: any) => {
  return performance.status === PerformanceStatus.OPEN && parseInt(performance.startTime, 10) >= Date.now() / 1000
}

export const processViewPerformanceSuccessResponse = (response, performanceId: string): PerformanceResponse => {
  const {
    home,
    away,
    status,
    homeGoal,
    awayGoal,
    startTime,
    endTime,
    treasuryFee,
    finalProphecy,
    amountCollected,
    amountWinCollected,
    amountDrawCollected,
    amountLoseCollected,
  } = response

  const statusKey = Object.keys(PerformanceStatus)[status]

  return {
    isLoading: false,
    performanceId,
    finalProphecy,
    home,
    away,
    homeGoal,
    awayGoal,
    status: PerformanceStatus[statusKey],
    startTime: startTime?.toString(),
    endTime: endTime?.toString(),
    treasuryFee: treasuryFee?.toString(),
    amountCollected: ethersToSerializedBigNumber(amountCollected),
    amountWinCollected: ethersToSerializedBigNumber(amountWinCollected),
    amountDrawCollected: ethersToSerializedBigNumber(amountDrawCollected),
    amountLoseCollected: ethersToSerializedBigNumber(amountLoseCollected),
  }
}

const processViewLotteryErrorResponse = (performanceId: string): PerformanceResponse => {
  return {
    isLoading: true,
    id: performanceId,
    performanceId,
    status: PerformanceStatus.PENDING,
    startTime: '',
    endTime: '',
    treasuryFee: '',
    homeGoal: 0,
    awayGoal: 0,
    finalProphecy: null,
    amountCollected: '0',
    amountWinCollected: '0',
    amountDrawCollected: '0',
    amountLoseCollected: '0',
  }
}

export const fetchPerformance = async (performanceId: string): Promise<PerformanceResponse> => {
  try {
    const performanceData = await betContract.viewPerformance(performanceId)
    return processViewPerformanceSuccessResponse(performanceData, performanceId)
  } catch (error) {
    return processViewLotteryErrorResponse(performanceId)
  }
}

export const fetchMultiplePerformances = async (performanceIds: string[]): Promise<PerformanceResponse[]> => {
  const calls = performanceIds.map((id) => ({
    name: 'viewPerformance',
    address: getBetAddress(),
    params: [id],
  }))

  try {
    const multicallRes = await multicallv2({ abi: prophesyAbi, calls, options: { requireSuccess: false } })
    const processedResponses = multicallRes.map((res, index) =>
      processViewPerformanceSuccessResponse(res[0], performanceIds[index]),
    )
    return processedResponses
  } catch (error) {
    console.error(error)
    return calls.map((call, index) => processViewLotteryErrorResponse(performanceIds[index]))
  }
}

export const fetchLatestPerformanceId = async (): Promise<EthersBigNumber> => {
  return betContract.latestPerformanceId()
}

export const fetchLatestPerformanceIdAndMaxBuy = async () => {
  try {
    const calls = ['latestPerformanceId', 'maxPriceProphecyInGde'].map((method) => ({
      address: getBetAddress(),
      name: method,
    }))
    const [[latestPerformanceId], [maxPriceProphecyInGde]] = (await multicallv2({
      abi: prophesyAbi,
      calls,
    })) as EthersBigNumber[][]

    return {
      latestPerformanceId: latestPerformanceId ? latestPerformanceId.toString() : null,
      maxPriceProphecyIngde: maxPriceProphecyInGde ? maxPriceProphecyInGde.toString() : null,
    }
  } catch (error) {
    return {
      latestPerformanceId: null,
      maxPriceProphecyIngde: null,
    }
  }
}

export const fetchLastPerformanceId = async (chainId?: number) => {
  try {
    const calls = ['latestPerformanceId'].map((method) => ({
      address: getBetAddress(chainId),
      name: method,
    }))
    const [[latestPerformanceId]] = (await multicallv2({
      abi: prophesyAbi,
      calls,
    })) as EthersBigNumber[][]

    return latestPerformanceId
  } catch (error) {
    return null
  }
}

const IGNORE = [4, 8]

export const getRoundIdsArray = (latestPerformanceId: string, round?: boolean): string[] => {
  const currentIdAsInt = parseInt(latestPerformanceId, 10) + (round ? 1 : 0)
  const roundIds = []
  for (let i = 0; i < currentIdAsInt; i++) {
    if (!IGNORE.includes(i)) {
      roundIds.push(i)
    }
  }
  return roundIds.filter((v) => v >= 0).map((roundId) => roundId.toString())
}

export const hasRoundBeenClaimed = (tickets: LotteryTicket[]): boolean => {
  const claimedTickets = tickets.filter((ticket) => ticket.status)
  return claimedTickets.length > 0
}
