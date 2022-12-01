import { useTranslation } from '@pancakeswap/localization'
import { AutoRenewIcon, Balance, Button, Flex, PresentWonIcon, Text, useToast } from '@pancakeswap/uikit'
import { useWeb3React } from '@pancakeswap/wagmi'
// import Balance from '@pancakeswap/uikit/components/Balance'
import { ToastDescriptionWithTx } from 'components/Toast'
import { PerformanceTicket, PerformanceTicketClaimData } from 'config/constants/types'
import useCatchTxError from 'hooks/useCatchTxError'
import { useBetContract } from 'hooks/useContract'
import { useState } from 'react'
import { useAppDispatch } from 'state'
import { usePriceGDEBusd } from 'state/farms/hooks'
import { fetchUserPerformances } from 'state/bet'
import { usePerformance } from 'state/bet/hooks'
import { callWithEstimateGas } from 'utils/calls'
import { getBalanceAmount } from '@pancakeswap/utils/formatBalance'
// import { getBalanceAmount } from '@pancakeswap/utils/formatBalance'

interface ClaimInnerProps {
  roundsToClaim: PerformanceTicketClaimData[]
  onSuccess?: () => void
}

const ClaimInnerContainer: React.FC<React.PropsWithChildren<ClaimInnerProps>> = ({ onSuccess, roundsToClaim }) => {
  const { account } = useWeb3React()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { maxPriceBetInGde, currentPerformanceId } = usePerformance()
  const { toastSuccess } = useToast()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const [activeClaimIndex, setActiveClaimIndex] = useState(0)
  const [pendingBatchClaims, setPendingBatchClaims] = useState(
    Math.ceil(roundsToClaim[activeClaimIndex].ticketsWithUnclaimedRewards.length / maxPriceBetInGde.toNumber()),
  )
  const prophesyContract = useBetContract()
  const activeClaimData = roundsToClaim[activeClaimIndex]

  const gdePriceBusd = usePriceGDEBusd()
  const GDEReward = activeClaimData.gdeTotal
  const dollarReward = GDEReward.times(gdePriceBusd)
  const rewardAsBalance = getBalanceAmount(GDEReward).toNumber()
  const dollarRewardAsBalance = getBalanceAmount(dollarReward).toNumber()

  const parseUnclaimedTicketDataForClaimCall = (
    ticketsWithUnclaimedRewards: PerformanceTicket[],
    performanceId: string,
  ) => {
    const ticketIds = ticketsWithUnclaimedRewards.map((ticket) => {
      return ticket.id
    })

    return { performanceId, ticketIds }
  }

  const claimPropheciesCallData = parseUnclaimedTicketDataForClaimCall(
    activeClaimData.ticketsWithUnclaimedRewards,
    activeClaimData.performanceId,
  )

  const shouldBatchRequest = maxPriceBetInGde.lt(claimPropheciesCallData.ticketIds.length)

  const handleProgressToNextClaim = () => {
    if (roundsToClaim.length > activeClaimIndex + 1) {
      // If there are still rounds to claim, move onto the next claim
      setActiveClaimIndex(activeClaimIndex + 1)
      dispatch(fetchUserPerformances({ account, performanceId: currentPerformanceId }))
    } else {
      onSuccess()
    }
  }

  const getTicketBatches = (ticketIds: string[], brackets: number[]): { ticketIds: string[]; brackets: number[] }[] => {
    const requests = []
    const maxAsNumber = maxPriceBetInGde.toNumber()

    for (let i = 0; i < ticketIds.length; i += maxAsNumber) {
      const ticketIdsSlice = ticketIds.slice(i, maxAsNumber + i)
      const bracketsSlice = brackets.slice(i, maxAsNumber + i)
      requests.push({ ticketIds: ticketIdsSlice, brackets: bracketsSlice })
    }

    return requests
  }

  const handleClaim = async () => {
    const { performanceId, ticketIds } = claimPropheciesCallData
    const receipt = await fetchWithCatchTxError(() => {
      return callWithEstimateGas(prophesyContract, 'claimBetting', [performanceId, ticketIds])
    })
    if (receipt?.status) {
      toastSuccess(
        t('Prizes Collected!'),
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your GDE prizes for round %performanceId% have been sent to your wallet', { performanceId })}
        </ToastDescriptionWithTx>,
      )
      handleProgressToNextClaim()
    }
  }

  const handleBatchClaim = async () => {
    const { performanceId, ticketIds } = claimPropheciesCallData
    const ticketBatches = getTicketBatches(ticketIds, undefined)
    const transactionsToFire = ticketBatches.length
    const receipts = []
    // eslint-disable-next-line no-restricted-syntax
    for (const ticketBatch of ticketBatches) {
      /* eslint-disable no-await-in-loop */
      const receipt = await fetchWithCatchTxError(() => {
        return callWithEstimateGas(prophesyContract, 'claimBetting', [performanceId, ticketBatch.ticketIds])
      })

      if (receipt?.status) {
        // One transaction within batch has succeeded
        receipts.push(receipt)
        setPendingBatchClaims(transactionsToFire - receipts.length)

        // More transactions are to be done within the batch. Issue toast to give user feedback.
        if (receipts.length !== transactionsToFire) {
          toastSuccess(
            t('Prizes Collected!'),
            <ToastDescriptionWithTx txHash={receipt.transactionHash}>
              {t(
                'Claim %claimNum% of %claimTotal% for round %performanceId% was successful. Please confirm the next transaction',
                {
                  claimNum: receipts.length,
                  claimTotal: transactionsToFire,
                  performanceId,
                },
              )}
            </ToastDescriptionWithTx>,
          )
        }
      } else {
        break
      }
    }

    // Batch is finished
    if (receipts.length === transactionsToFire) {
      toastSuccess(
        t('Prizes Collected!'),
        t('Your GDE prizes for performance #%performanceId% have been sent to your wallet', { performanceId }),
      )
      handleProgressToNextClaim()
    }
  }

  return (
    <>
      <Flex flexDirection="column">
        <Text mb="4px" textAlign={['center', null, 'left']}>
          {t('You won')}
        </Text>
        <Flex
          alignItems={['flex-start', null, 'center']}
          justifyContent={['flex-start', null, 'space-between']}
          flexDirection={['column', null, 'row']}
        >
          <Balance
            textAlign={['center', null, 'left']}
            lineHeight="1.1"
            value={rewardAsBalance}
            fontSize="44px"
            bold
            color="secondary"
            unit=" GDE!"
          />
          <PresentWonIcon ml={['0', null, '12px']} width="64px" />
        </Flex>
        <Balance
          mt={['12px', null, '0']}
          textAlign={['center', null, 'left']}
          value={dollarRewardAsBalance}
          fontSize="12px"
          color="textSubtle"
          unit=" USD"
          prefix="~"
        />
      </Flex>

      <Flex alignItems="center" justifyContent="center">
        <Text mt="8px" fontSize="12px" color="textSubtle">
          {t('Performance')} #{activeClaimData.performanceId}
        </Text>
      </Flex>
      <Flex alignItems="center" justifyContent="center">
        <Button
          isLoading={pendingTx}
          endIcon={pendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
          mt="20px"
          width="100%"
          onClick={() => (shouldBatchRequest ? handleBatchClaim() : handleClaim())}
        >
          {pendingTx ? t('Claiming') : t('Claim')} {pendingBatchClaims > 1 ? `(${pendingBatchClaims})` : ''}
        </Button>
      </Flex>
    </>
  )
}

export default ClaimInnerContainer
