import { useState, useEffect } from 'react'
import { useWeb3React } from '@pancakeswap/wagmi'
import { useGetPerformancesGraphData, useGetUserPerformancesGraphData, usePerformance } from 'state/bet/hooks'
import fetchUnclaimedUserRewards from 'state/bet/fetchUnclaimedUserRewards'
import { FetchStatus } from 'config/constants/types'

const useGetUnclaimedRewards = () => {
  const { account, chainId } = useWeb3React()
  const { isTransitioning, currentPerformanceId } = usePerformance()
  const userPerformanceData = useGetUserPerformancesGraphData()
  const performancesData = useGetPerformancesGraphData()
  const [unclaimedRewards, setUnclaimedRewards] = useState([])
  const [fetchStatus, setFetchStatus] = useState(FetchStatus.Idle)

  useEffect(() => {
    // Reset on account change and round transition
    setFetchStatus(FetchStatus.Idle)
  }, [account, isTransitioning])

  const fetchAllRewards = async () => {
    setFetchStatus(FetchStatus.Fetching)
    const unclaimedRewardsResponse = await fetchUnclaimedUserRewards(
      account,
      userPerformanceData,
      performancesData,
      currentPerformanceId,
      chainId,
    )
    setUnclaimedRewards(unclaimedRewardsResponse)
    setFetchStatus(FetchStatus.Fetched)
  }

  return { fetchAllRewards, unclaimedRewards, fetchStatus }
}

export default useGetUnclaimedRewards
