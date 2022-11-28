import { MaxUint256 } from '@ethersproject/constants'
import { useTranslation } from '@pancakeswap/localization'
import { bscTokens } from '@pancakeswap/tokens'
import { BalanceInput, Button, Flex, Modal, Skeleton, Text, Ticket, useToast, useTooltip } from '@pancakeswap/uikit'
import { useWeb3React } from '@pancakeswap/wagmi'
import BigNumber from 'bignumber.js'
import ApproveConfirmButtons, { ButtonArrangement } from 'components/ApproveConfirmButtons'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { ToastDescriptionWithTx } from 'components/Toast'
import { FetchStatus } from 'config/constants/types'
import useApproveConfirmTransaction from 'hooks/useApproveConfirmTransaction'
import { useCallWithMarketGasPrice } from 'hooks/useCallWithMarketGasPrice'
import { useGDE, useBetContract } from 'hooks/useContract'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppDispatch } from 'state'
import { usePriceGDEBusd } from 'state/farms/hooks'
import { usePerformance } from 'state/bet/hooks'
import { fetchUserProphecyAndPerformance } from 'state/bet'
import styled from 'styled-components'
import { BIG_ZERO } from 'utils/bigNumber'
import { getDecimalAmount, getFullDisplayBalance } from '@pancakeswap/utils/formatBalance'
import { requiresApproval } from 'utils/requiresApproval'
import NumTicketsToBuyButton from './NumTicketsToBuyButton'

const StyledModal = styled(Modal)`
  ${({ theme }) => theme.mediaQueries.md} {
    width: 280px;
  }
`

const ActionGroup = styled(Flex)`
  justify-content: space-between;
`

const ProphesyButton = styled(Button)<{ activated?: boolean }>`
  border-radius: 0;
  ${({ activated }) => (activated ? `border-color: #280d5f` : '')}
`

const ShortcutButtonsWrapper = styled(Flex)<{ isVisible: boolean }>`
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 24px;
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
`

interface ProphecyModalProps {
  onDismiss?: () => void
}

enum ProphesyStage {
  WIN = 1,
  DRAW = 2,
  LOSE = 3,
}

const ProphecyModal: React.FC<React.PropsWithChildren<ProphecyModalProps>> = ({ onDismiss }) => {
  const { account } = useWeb3React()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    maxPriceBetInGde,
    currentPerformanceId,
    currentPerformance: {
      priceTicketInGde,
      discountDivisor,
      home,
      away,
      userTickets: { performances: userCurrentTickets },
    },
  } = usePerformance()
  const { callWithMarketGasPrice } = useCallWithMarketGasPrice()
  const [ticketsToBuy, setTicketsToBuy] = useState('1')
  const [totalCost, setTotalCost] = useState('')
  const [prophesyStage, setProphesyStage] = useState<ProphesyStage>(ProphesyStage.WIN)
  const [maxPossibleTicketPurchase, setMaxPossibleTicketPurchase] = useState(BIG_ZERO)
  const [maxTicketPurchaseExceeded, setMaxTicketPurchaseExceeded] = useState(false)
  const [userNotEnoughCake, setUserNotEnoughGDE] = useState(false)
  const prophesyContract = useBetContract()
  const { reader: GDEContractReader, signer: gdeContractApprover } = useGDE()
  const { toastSuccess } = useToast()
  const { balance: userCake, fetchStatus } = useTokenBalance(bscTokens.gde.address)
  // balance from useTokenBalance causes rerenders in effects as a new BigNumber is instantiated on each render, hence memoising it using the stringified value below.
  const stringifiedUserCake = userCake.toJSON()
  const memoisedUserCake = useMemo(() => new BigNumber(stringifiedUserCake), [stringifiedUserCake])

  const gdePriceBusd = usePriceGDEBusd()
  const dispatch = useAppDispatch()
  const hasFetchedBalance = fetchStatus === FetchStatus.Fetched
  const userGDEDisplayBalance = getFullDisplayBalance(userCake, 18, 3)

  const TooltipComponent = () => (
    <>
      <Text mb="16px">{t('Release multiple prophecy in a single transaction')}</Text>
    </>
  )
  const { targetRef, tooltip, tooltipVisible } = useTooltip(<TooltipComponent />, {
    placement: 'bottom-end',
    tooltipOffset: [20, 10],
  })

  const limitNumberByMaxTicketsPerBuy = useCallback(
    (number: BigNumber) => {
      return number.gt(maxPriceBetInGde) ? maxPriceBetInGde : number
    },
    [maxPriceBetInGde],
  )

  const getTicketCostAfterDiscount = useCallback(
    (numberTickets: BigNumber) => priceTicketInGde?.times(numberTickets),
    [priceTicketInGde],
  )

  const getMaxTicketBuyWithDiscount = useCallback(
    (numberTickets: BigNumber) => {
      const costAfterDiscount = getTicketCostAfterDiscount(numberTickets)
      const costBeforeDiscount = priceTicketInGde?.times(numberTickets)
      const discountAmount = costBeforeDiscount.minus(costAfterDiscount)
      const ticketsBoughtWithDiscount = discountAmount.div(priceTicketInGde)
      const overallTicketBuy = numberTickets.plus(ticketsBoughtWithDiscount)
      return { overallTicketBuy, ticketsBoughtWithDiscount }
    },
    [getTicketCostAfterDiscount, priceTicketInGde],
  )

  const validateInput = useCallback(
    (inputNumber: BigNumber) => {
      const limitedNumberTickets = limitNumberByMaxTicketsPerBuy(inputNumber)
      const cakeCostAfterDiscount = getTicketCostAfterDiscount(limitedNumberTickets)

      if (cakeCostAfterDiscount.gt(userCake)) {
        setUserNotEnoughGDE(true)
      } else if (limitedNumberTickets.eq(maxPriceBetInGde)) {
        setMaxTicketPurchaseExceeded(true)
      } else {
        setUserNotEnoughGDE(false)
        setMaxTicketPurchaseExceeded(false)
      }
    },
    [limitNumberByMaxTicketsPerBuy, getTicketCostAfterDiscount, maxPriceBetInGde, userCake],
  )

  useEffect(() => {
    const getMaxPossiblePurchase = () => {
      const maxBalancePurchase = memoisedUserCake.div(priceTicketInGde)
      const limitedMaxPurchase = limitNumberByMaxTicketsPerBuy(maxBalancePurchase)
      let maxPurchase

      // If the users' max GDE balance purchase is less than the contract limit - factor the discount logic into the max number of tickets they can purchase
      if (limitedMaxPurchase.lt(maxPriceBetInGde)) {
        // Get max tickets purchasable with the users' balance, as well as using the discount to buy tickets
        const { overallTicketBuy: maxPlusDiscountTickets } = getMaxTicketBuyWithDiscount(limitedMaxPurchase)

        // Knowing how many tickets they can buy when counting the discount - plug that total in, and see how much that total will get discounted
        const { ticketsBoughtWithDiscount: secondTicketDiscountBuy } =
          getMaxTicketBuyWithDiscount(maxPlusDiscountTickets)

        // Add the additional tickets that can be bought with the discount, to the original max purchase
        maxPurchase = limitedMaxPurchase.plus(secondTicketDiscountBuy)
      } else {
        maxPurchase = limitedMaxPurchase
      }

      if (hasFetchedBalance && maxPurchase.lt(1)) {
        setUserNotEnoughGDE(true)
      } else {
        setUserNotEnoughGDE(false)
      }

      setMaxPossibleTicketPurchase(maxPurchase)
    }
    getMaxPossiblePurchase()
  }, [
    maxPriceBetInGde,
    priceTicketInGde,
    memoisedUserCake,
    limitNumberByMaxTicketsPerBuy,
    getTicketCostAfterDiscount,
    getMaxTicketBuyWithDiscount,
    hasFetchedBalance,
  ])

  useEffect(() => {
    const numberOfTicketsToBuy = new BigNumber(ticketsToBuy)
    const costAfterDiscount = getTicketCostAfterDiscount(numberOfTicketsToBuy)
    setTotalCost(costAfterDiscount.gt(0) ? getFullDisplayBalance(costAfterDiscount) : '0')
  }, [ticketsToBuy, priceTicketInGde, discountDivisor, getTicketCostAfterDiscount])

  const getNumTicketsByPercentage = (percentage: number): number => {
    const percentageOfMaxTickets = maxPossibleTicketPurchase.gt(0)
      ? maxPossibleTicketPurchase.div(new BigNumber(100)).times(new BigNumber(percentage))
      : BIG_ZERO
    return Math.floor(percentageOfMaxTickets.toNumber())
  }

  const tenPercentOfBalance = getNumTicketsByPercentage(10)
  const twentyFivePercentOfBalance = getNumTicketsByPercentage(25)
  const fiftyPercentOfBalance = getNumTicketsByPercentage(50)
  const oneHundredPercentOfBalance = getNumTicketsByPercentage(100)

  const handleInputChange = (input: string) => {
    // Force input to integer
    const inputAsInt = parseInt(input, 10)
    const inputAsBN = new BigNumber(inputAsInt)
    const limitedNumberTickets = limitNumberByMaxTicketsPerBuy(inputAsBN)
    validateInput(inputAsBN)
    setTicketsToBuy(inputAsInt ? limitedNumberTickets.toString() : '')
  }

  const handleNumberButtonClick = (number: number) => {
    setTicketsToBuy(number.toFixed())
    setUserNotEnoughGDE(false)
    setMaxTicketPurchaseExceeded(false)
  }

  const { isApproving, isApproved, isConfirmed, isConfirming, handleApprove, handleConfirm } =
    useApproveConfirmTransaction({
      onRequiresApproval: async () => {
        return requiresApproval(GDEContractReader, account, prophesyContract.address)
      },
      onApprove: () => {
        return callWithMarketGasPrice(gdeContractApprover, 'approve', [prophesyContract.address, MaxUint256])
      },
      onApproveSuccess: async ({ receipt }) => {
        toastSuccess(
          t('Contract enabled - you can now purchase tickets'),
          <ToastDescriptionWithTx txHash={receipt.transactionHash} />,
        )
      },
      onConfirm: () => {
        return callWithMarketGasPrice(prophesyContract, 'prophecyRelease', [
          currentPerformanceId,
          prophesyStage,
          getDecimalAmount(new BigNumber(ticketsToBuy), 18).toString(),
        ])
      },
      onSuccess: async ({ receipt }) => {
        onDismiss?.()
        dispatch(fetchUserProphecyAndPerformance({ account, performanceId: currentPerformanceId }))
        toastSuccess(t('Prophecy ticket submitted!'), <ToastDescriptionWithTx txHash={receipt.transactionHash} />)
      },
    })

  const getErrorMessage = () => {
    if (userNotEnoughCake) return t('Insufficient GDE balance')
    return t('The maximum number of tickets you can buy in one transaction is %maxTickets%', {
      maxTickets: maxPriceBetInGde.toString(),
    })
  }

  const disableBuying =
    !isApproved || isConfirmed || userNotEnoughCake || !ticketsToBuy || new BigNumber(ticketsToBuy).lte(0)

  return (
    <StyledModal title={t('Prophesy')} onDismiss={onDismiss} headerBackground={theme.colors.gradientCardHeader}>
      {tooltipVisible && tooltip}
      <Flex alignItems="center" justifyContent="space-between" mb="8px">
        <Text color="textSubtle">{t('Release')}:</Text>
        <Flex alignItems="center" minWidth="70px">
          <Text mr="4px" bold>
            {t('Winner?')}
          </Text>
          <Ticket />
        </Flex>
      </Flex>
      <BalanceInput
        isWarning={account && (userNotEnoughCake || maxTicketPurchaseExceeded)}
        placeholder="0"
        value={ticketsToBuy}
        onUserInput={handleInputChange}
        currencyValue={
          gdePriceBusd.gt(0) &&
          `~${ticketsToBuy ? getFullDisplayBalance(priceTicketInGde?.times(new BigNumber(ticketsToBuy))) : '0.00'} GDE`
        }
      />
      <Flex alignItems="center" justifyContent="flex-end" mt="4px" mb="12px">
        <Flex justifyContent="flex-end" flexDirection="column">
          {account && (userNotEnoughCake || maxTicketPurchaseExceeded) && (
            <Text fontSize="12px" color="failure">
              {getErrorMessage()}
            </Text>
          )}
          {account && (
            <Flex justifyContent="flex-end">
              <Text fontSize="12px" color="textSubtle" mr="4px">
                GDE {t('Balance')}:
              </Text>
              {hasFetchedBalance ? (
                <Text fontSize="12px" color="textSubtle">
                  {userGDEDisplayBalance}
                </Text>
              ) : (
                <Skeleton width={50} height={12} />
              )}
            </Flex>
          )}
        </Flex>
      </Flex>

      {account && !hasFetchedBalance ? (
        <Skeleton width="100%" height={20} mt="8px" mb="24px" />
      ) : (
        <ShortcutButtonsWrapper isVisible={account && hasFetchedBalance && oneHundredPercentOfBalance >= 1}>
          {tenPercentOfBalance >= 1 && (
            <NumTicketsToBuyButton onClick={() => handleNumberButtonClick(tenPercentOfBalance)}>
              {hasFetchedBalance ? `10%` : ``}
            </NumTicketsToBuyButton>
          )}
          {twentyFivePercentOfBalance >= 1 && (
            <NumTicketsToBuyButton onClick={() => handleNumberButtonClick(twentyFivePercentOfBalance)}>
              {hasFetchedBalance ? '25%' : ``}
            </NumTicketsToBuyButton>
          )}
          {fiftyPercentOfBalance >= 1 && (
            <NumTicketsToBuyButton onClick={() => handleNumberButtonClick(fiftyPercentOfBalance)}>
              {hasFetchedBalance ? '50%' : ``}
            </NumTicketsToBuyButton>
          )}
          {oneHundredPercentOfBalance >= 1 && (
            <NumTicketsToBuyButton onClick={() => handleNumberButtonClick(oneHundredPercentOfBalance)}>
              <Text small color="currentColor" textTransform="uppercase">
                {t('Max')}
              </Text>
            </NumTicketsToBuyButton>
          )}
        </ShortcutButtonsWrapper>
      )}
      <Flex flexDirection="column">
        <Flex mb="8px" justifyContent="space-between">
          <Text color="textSubtle" fontSize="14px">
            {t('Cost')} (GDE)
          </Text>
          <Text color="textSubtle" fontSize="14px">
            {priceTicketInGde && getFullDisplayBalance(priceTicketInGde?.times(ticketsToBuy || 0))} GDE
          </Text>
        </Flex>
        <Flex borderTop={`1px solid ${theme.colors.cardBorder}`} pt="8px" mb="24px" justifyContent="space-between">
          <Text color="textSubtle" fontSize="16px">
            {t('You pay')}
          </Text>
          <Text fontSize="16px" bold>
            ~{totalCost} GDE
          </Text>
        </Flex>
        {account ? (
          <>
            {isApproved && (
              <ActionGroup mb="8px">
                <ProphesyButton
                  px="3px"
                  display="flex"
                  width="92px"
                  justifyContent="center"
                  variant={ProphesyStage.WIN === prophesyStage ? 'primary' : 'secondary'}
                  disabled={disableBuying || isConfirming}
                  onClick={() => {
                    setProphesyStage(ProphesyStage.WIN)
                  }}
                >
                  {home?.name}
                </ProphesyButton>
                <ProphesyButton
                  width="80px"
                  variant={ProphesyStage.DRAW === prophesyStage ? 'primary' : 'secondary'}
                  disabled={disableBuying || isConfirming}
                  onClick={() => {
                    setProphesyStage(ProphesyStage.DRAW)
                  }}
                >
                  {t('Draw')}
                </ProphesyButton>
                <ProphesyButton
                  px="3px"
                  width="92px"
                  display="flex"
                  justifyContent="center"
                  variant={ProphesyStage.LOSE === prophesyStage ? 'primary' : 'secondary'}
                  disabled={disableBuying || isConfirming}
                  onClick={() => {
                    setProphesyStage(ProphesyStage.LOSE)
                  }}
                >
                  {away?.name}
                </ProphesyButton>
              </ActionGroup>
            )}
            <ApproveConfirmButtons
              isApproveDisabled={isApproved}
              isApproving={isApproving}
              isConfirmDisabled={disableBuying}
              isConfirming={isConfirming}
              onApprove={handleApprove}
              onConfirm={handleConfirm}
              buttonArrangement={ButtonArrangement.SEQUENTIAL}
              confirmLabel={t('Bet')}
              confirmId="prophesyBuyInstant"
            />
          </>
        ) : (
          <ConnectWalletButton />
        )}

        <Text mt="24px" fontSize="12px" color="textSubtle">
          {t(
            '"Bet Instantly" chooses win/draw/lose for home, with no duplicates among your prophecies. Prices are set before each round starts, equal to $5 at that time. Purchases are final.',
          )}
        </Text>
      </Flex>
    </StyledModal>
  )
}

export default ProphecyModal
