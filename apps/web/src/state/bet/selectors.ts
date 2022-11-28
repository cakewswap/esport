import BigNumber from 'bignumber.js'
import { createSelector } from '@reduxjs/toolkit'
import { State } from '../types'

const selectLatestPerformanceId = (state: State) => state.bet.latestPerformanceId
const selectCurrentPerformanceId = (state: State) => state.bet.currentPerformanceId
const selectIsTransitioning = (state: State) => state.bet.isTransitioning
const selectCurrentPerformance = (state: State) => state.bet.currentPerformance
const selectUserPerformanceData = (state: State) => state.bet.userPerformanceData
const selectPerformancesData = (state: State) => state.bet.performancesData
const selectMaxPriceBetInGde = (state: State) => state.bet.maxPriceBetInGde

export const makePerformanceGraphDataByIdSelector = (performanceId: string) =>
  createSelector([selectPerformancesData], (performancesData) =>
    performancesData?.find((performance) => performance.id === performanceId),
  )

export const maxPriceBetInGdeSelector = createSelector([selectMaxPriceBetInGde], (maxPriceBetInGdeString) => {
  return new BigNumber(maxPriceBetInGdeString)
})

export const currentPerformanceSelector = createSelector(
  selectLatestPerformanceId,
  selectCurrentPerformance,
  selectPerformancesData,
  (latestPerformanceId, currentPerformance, performances) => {
    let _performance = (currentPerformance || {}) as any

    if (
      (!_performance?.performanceId || _performance?.performanceId === latestPerformanceId) &&
      performances?.length > 0
    ) {
      const latestId = (parseInt(latestPerformanceId, 10) - 1).toString()
      _performance = performances?.find((v) => latestId === v.performanceId)
    }

    return {
      ..._performance,
      priceTicketIngde: new BigNumber(10 ** 18),
      amountCollected: new BigNumber(_performance?.amountCollected),
      amountWinCollected: new BigNumber(_performance?.amountWinCollected),
      amountDrawCollected: new BigNumber(_performance?.amountDrawCollected),
      amountLoseCollected: new BigNumber(_performance?.amountLoseCollected),
    }
  },
)

export const prophesySelector = createSelector(
  [
    currentPerformanceSelector,
    selectIsTransitioning,
    selectCurrentPerformanceId,
    selectLatestPerformanceId,
    selectUserPerformanceData,
    selectPerformancesData,
    maxPriceBetInGdeSelector,
  ],
  (
    processedCurrentPerformance,
    isTransitioning,
    currentPerformanceId,
    latestPerformanceId,
    userPerformanceData,
    performancesData,
    maxPriceBetInGde,
  ) => {
    return {
      currentPerformanceId,
      latestPerformanceId,
      maxPriceBetInGde,
      isTransitioning,
      userPerformanceData,
      performancesData,
      currentPerformance: processedCurrentPerformance,
    }
  },
)
