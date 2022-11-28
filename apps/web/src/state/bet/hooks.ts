import { useEffect } from 'react'
import { useWeb3React } from '@pancakeswap/wagmi'
import { useSelector, batch } from 'react-redux'
import { useAppDispatch } from 'state'
import { useFastRefreshEffect } from 'hooks/useRefreshEffect'
import { State } from '../types'
import {
  fetchLatestPerformanceId,
  fetchLatestPerformance,
  fetchUserProphecyAndPerformance,
  fetchPublicPerformances,
  fetchHighlightPerformance,
} from '.'
import { prophesySelector } from './selectors'

// Performance
export const useCurrentPerformanceId = () => {
  return useSelector((state: State) => state.bet.currentPerformanceId)
}

export const useLatestPerformanceId = () => {
  return useSelector((state: State) => state.bet.latestPerformanceId)
}

export const useGetUserPerformancesGraphData = () => {
  return useSelector((state: State) => state.bet.userPerformanceData)
}

export const useGetPerformancesGraphData = () => {
  return useSelector((state: State) => state.bet.performancesData)
}

export const useFetchPerformances = (fetchPublicDataOnly = false) => {
  const { account } = useWeb3React()
  const dispatch = useAppDispatch()
  const latestPerformanceId = useLatestPerformanceId()
  const currentPerformanceId = useCurrentPerformanceId()

  useEffect(() => {
    // get current lottery ID & max ticket buy
    dispatch(fetchHighlightPerformance())
    dispatch(fetchLatestPerformanceId())
  }, [dispatch])

  useFastRefreshEffect(() => {
    if (latestPerformanceId) {
      batch(() => {
        // Get historical lottery data from nodes +  last 100 subgraph entries
        dispatch(fetchPublicPerformances({ performanceId: latestPerformanceId }))
        // get public data for current lottery
        dispatch(fetchLatestPerformance({ performanceId: latestPerformanceId }))
      })
    }
  }, [dispatch, latestPerformanceId])

  useEffect(() => {
    // get user tickets for current lottery, and user lottery subgraph data
    if (account && currentPerformanceId && !fetchPublicDataOnly) {
      dispatch(fetchUserProphecyAndPerformance({ account, performanceId: currentPerformanceId }))
    }
  }, [dispatch, currentPerformanceId, account, fetchPublicDataOnly])
}

export const usePerformance = () => {
  return useSelector(prophesySelector)
}
