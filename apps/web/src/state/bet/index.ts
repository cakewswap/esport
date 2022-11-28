/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { LotteryTicket, PerformanceStatus, PerformanceTicket } from 'config/constants/types'
import { PerformanceRoundGraphEntity, PerformanceUserGraphEntity, TicketResponse, BetState } from 'state/types'
import { fetchPerformance, fetchLatestPerformanceIdAndMaxBuy } from './helpers'
import getPerformancesData from './getPerformancesData'
import getUserPerformanceData, { getGraphLotteryUser } from './getUserPerformanceData'
import { resetUserState } from '../global/actions'

interface PublicPerformanceData {
  latestPerformanceId: string
  maxPriceProphecyIngde: string
}

const initialState: BetState = {
  latestPerformanceId: null,
  isTransitioning: false,
  maxPriceProphecyIngde: null,
  currentPerformance: {
    performanceId: null,
    status: PerformanceStatus.PENDING,
    startTime: '',
    endTime: '',
    treasuryFee: '',
    amountCollected: '',
    userTickets: {
      isLoading: true,
      tickets: [],
    },
  },
  performancesData: null,
  userPerformanceData: { account: '', totalgde: '', totalPerformances: '' },
} as any

export const fetchHighlightPerformance = createAsyncThunk<string>('bet/fetchHighlightPerformance', async () => {
  const res = await fetch('/bet.json')
  const data = await res.json()
  return data.hightLight
})

export const selectPerformance = createAsyncThunk<string, { performanceId: string }>(
  'bet/selectPerformance',
  async ({ performanceId }) => performanceId,
)

export const fetchLatestPerformance = createAsyncThunk<TicketResponse, { performanceId: string }>(
  'bet/fetchLatestPerformance',
  async ({ performanceId }) => {
    const performanceInfo = await fetchPerformance(performanceId)
    return performanceInfo
  },
)

export const fetchCurrentPerformance = createAsyncThunk<TicketResponse, { performanceId: string }>(
  'bet/fetchCurrentPerformance',
  async ({ performanceId }) => fetchPerformance(performanceId),
)

export const fetchLatestPerformanceId = createAsyncThunk<PublicPerformanceData>(
  'bet/fetchLatestPerformanceId',
  async () => {
    const currentIdAndMaxBuy = await fetchLatestPerformanceIdAndMaxBuy()
    return currentIdAndMaxBuy
  },
)

export const fetchUserProphecyAndPerformance = createAsyncThunk<
  { userTickets: PerformanceTicket[]; userPerformances: PerformanceUserGraphEntity },
  { account: string; performanceId: string }
>('bet/fetchUserProphecyAndPerformance', async ({ account, performanceId }) => {
  const userPerformancesRes = await getUserPerformanceData(account, performanceId)
  const userParticipationInCurrentRound = userPerformancesRes.performances?.find(
    (round) => round.performanceId === performanceId,
  )

  const userTickets = userParticipationInCurrentRound?.tickets

  // User has not bought tickets for the current lottery, or there has been an error
  if (!userTickets || userTickets.length === 0) {
    return { userTickets: [], userPerformances: userPerformancesRes }
  }

  return { userTickets, userPerformances: userPerformancesRes }
})

export const fetchPublicPerformances = createAsyncThunk<PerformanceRoundGraphEntity[], { performanceId: string }>(
  'bet/fetchPublicPerformances',
  async ({ performanceId }) => {
    const performances = await getPerformancesData(performanceId)
    return performances
  },
)

export const fetchUserPerformances = createAsyncThunk<
  PerformanceUserGraphEntity,
  { account: string; performanceId: string }
>('bet/fetchUserPerformances', async ({ account, performanceId }) => {
  const userPerformances = await getUserPerformanceData(account, performanceId)
  return userPerformances
})

export const fetchAdditionalUserPeruserPerformances = createAsyncThunk<
  PerformanceUserGraphEntity,
  { account: string; skip?: number }
>('bet/fetchAdditionalUserPeruserPerformances', async ({ account, skip }) => {
  const additionalUserPeruserPerformances = await getGraphLotteryUser(account, undefined, skip)
  return additionalUserPeruserPerformances
})

export const setLotteryIsTransitioning = createAsyncThunk<{ isTransitioning: boolean }, { isTransitioning: boolean }>(
  `bet/setIsTransitioning`,
  async ({ isTransitioning }) => {
    return { isTransitioning }
  },
)

export const ProphesySlice = createSlice({
  name: 'Prophesy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(resetUserState, (state) => {
      state.userPerformanceData = { ...initialState.userPerformanceData }
      state.currentPerformance = {
        ...state.currentPerformance,
        userTickets: { ...initialState.currentPerformance.userTickets },
      }
    })
    builder.addCase(fetchCurrentPerformance.fulfilled, (state, action: PayloadAction<TicketResponse>) => {
      state.currentPerformance = { ...state.currentPerformance, ...action.payload } as any
    })
    builder.addCase(fetchLatestPerformanceId.fulfilled, (state, action: PayloadAction<PublicPerformanceData>) => {
      state.latestPerformanceId = action.payload.latestPerformanceId
      state.maxPriceProphecyInGde = action.payload.maxPriceProphecyInGde
    })
    builder.addCase(
      fetchUserProphecyAndPerformance.fulfilled,
      (
        state,
        action: PayloadAction<{ userTickets: PerformanceTicket[]; userPerformances: PerformanceUserGraphEntity }>,
      ) => {
        if (!state.currentPerformance?.performanceId) {
          if (state.currentPerformanceId) {
            state.currentPerformance = state.performancesData?.find(
              (v) => v.performanceId === state.currentPerformanceId,
            )
          }
        }

        state.currentPerformance = {
          ...state.currentPerformance,
          userTickets: { isLoading: false, tickets: action.payload.userTickets },
        }

        state.userPerformanceData = action.payload.userPerformances as any
      },
    )
    builder.addCase(
      fetchPublicPerformances.fulfilled,
      (state, action: PayloadAction<PerformanceRoundGraphEntity[]>) => {
        state.performancesData = action.payload
      },
    )
    builder.addCase(fetchUserPerformances.fulfilled, (state, action: PayloadAction<PerformanceUserGraphEntity>) => {
      state.userPerformanceData = action.payload as any
    })
    builder.addCase(selectPerformance.fulfilled, (state, action: PayloadAction<string>) => {
      if (state.performancesData) {
        state.currentPerformanceId = action.payload
        state.currentPerformance = state.performancesData.find((item) => item.performanceId === action.payload)
      }
    })
    builder.addCase(
      fetchAdditionalUserPeruserPerformances.fulfilled,
      (state, action: PayloadAction<PerformanceUserGraphEntity>) => {
        const mergedRounds = [...state.userPerformanceData.performances, ...action.payload.performances]
        state.userPerformanceData = { ...state.userPerformanceData, performances: mergedRounds }
      },
    )
    builder.addCase(
      setLotteryIsTransitioning.fulfilled,
      (state, action: PayloadAction<{ isTransitioning: boolean }>) => {
        state.isTransitioning = action.payload.isTransitioning
      },
    )
    builder.addCase(fetchHighlightPerformance.fulfilled, (state, action: PayloadAction<string>) => {
      state.currentPerformanceId = action.payload

      if (state.performancesData) {
        state.currentPerformance = state.performancesData.find((item) => item.performanceId === action.payload)
      }
    })
  },
})

export default ProphesySlice.reducer
