import styled, { keyframes } from 'styled-components'
import { Box, Flex, Heading, Skeleton, Balance } from '@pancakeswap/uikit'
import { PerformanceStatus } from 'config/constants/types'
import { useTranslation } from '@pancakeswap/localization'
import { usePriceGDEBusd } from 'state/farms/hooks'
import { usePerformance } from 'state/bet/hooks'
import { getBalanceNumber } from '@pancakeswap/utils/formatBalance'
import { processViewPerformanceOpen } from 'state/bet/helpers'
import BuyTicketsButton from './BuyTicketsButton'
import { PerformanceHighlight } from './PerformanceHighlight'

const floatingStarsLeft = keyframes`
  from {
    transform: translate(0,  0px);
  }
  50% {
    transform: translate(10px, 10px);
  }
  to {
    transform: translate(0, -0px);
  }
`

const floatingStarsRight = keyframes`
  from {
    transform: translate(0,  0px);
  }
  50% {
    transform: translate(-10px, 10px);
  }
  to {
    transform: translate(0, -0px);
  }
`

const floatingTicketLeft = keyframes`
  from {
    transform: translate(0,  0px);
  }
  50% {
    transform: translate(-10px, 15px);
  }
  to {
    transform: translate(0, -0px);
  }
`

const floatingTicketRight = keyframes`
  from {
    transform: translate(0,  0px);
  }
  50% {
    transform: translate(10px, 15px);
  }
  to {
    transform: translate(0, -0px);
  }
`

const mainTicketAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(6deg);
  }
  to {
    transform: rotate(0deg);
  }
`

const TicketContainer = styled(Flex)`
  padding: 20px;
  background: #febe29;
  border-radius: 20px;
  flex-direction: column;
  animation: ${mainTicketAnimation} 3s ease-in-out infinite;
`

const PrizeTotalBalance = styled(Balance)`
  background: ${({ theme }) => theme.colors.white};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`

const Decorations = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: url(/images/decorations/bg-star.svg);
  background-repeat: no-repeat;
  background-position: center 0;
`

const StarsDecorations = styled(Box)`
  position: absolute;
  width: 100%;
  height: 100%;

  & img {
    position: absolute;
  }

  & :nth-child(1) {
    animation: ${floatingStarsLeft} 3s ease-in-out infinite;
    animation-delay: 0.25s;
  }
  & :nth-child(2) {
    animation: ${floatingStarsLeft} 3.5s ease-in-out infinite;
    animation-delay: 0.5s;
  }
  & :nth-child(3) {
    animation: ${floatingStarsRight} 4s ease-in-out infinite;
    animation-delay: 0.75s;
  }
  & :nth-child(4) {
    animation: ${floatingTicketLeft} 6s ease-in-out infinite;
    animation-delay: 0.2s;
  }
  & :nth-child(5) {
    animation: ${floatingTicketRight} 6s ease-in-out infinite;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    & :nth-child(1) {
      left: 3%;
      top: 42%;
    }
    & :nth-child(2) {
      left: 9%;
      top: 23%;
    }
    & :nth-child(3) {
      right: 2%;
      top: 24%;
    }
    & :nth-child(4) {
      left: 8%;
      top: 67%;
    }
    & :nth-child(5) {
      right: 8%;
      top: 67%;
    }
  }

  ${({ theme }) => theme.mediaQueries.md} {
    & :nth-child(1) {
      left: 10%;
      top: 42%;
    }
    & :nth-child(2) {
      left: 17%;
      top: 23%;
    }
    & :nth-child(3) {
      right: 10%;
      top: 24%;
    }
    & :nth-child(4) {
      left: 17%;
      top: 67%;
    }
    & :nth-child(5) {
      right: 17%;
      top: 67%;
    }
  }

  ${({ theme }) => theme.mediaQueries.xl} {
    & :nth-child(1) {
      left: 19%;
      top: 42%;
    }
    & :nth-child(2) {
      left: 25%;
      top: 23%;
    }
    & :nth-child(3) {
      right: 19%;
      top: 24%;
    }
    & :nth-child(4) {
      left: 24%;
      top: 67%;
    }
    & :nth-child(5) {
      right: 24%;
      top: 67%;
    }
  }
`

const ProphesyRate = styled(Box)`
  display: flex;
  flex-direction: row;
`

const ProphesyItem = styled.div`
  margin: 10px;
  text-align: center;
`

const Hero = () => {
  const { t } = useTranslation()
  const gdePriceBusd = usePriceGDEBusd()

  const { currentPerformance } = usePerformance()

  const { amountWinCollected, amountDrawCollected, amountLoseCollected, status } = currentPerformance

  const prizeWinInBusd = amountWinCollected.times(gdePriceBusd)
  const prizeDrawInBusd = amountDrawCollected.times(gdePriceBusd)
  const prizeLosenInBusd = amountLoseCollected.times(gdePriceBusd)

  const getHeroHeading = () => {
    if (status !== PerformanceStatus.PENDING) {
      return (
        <ProphesyRate>
          <ProphesyItem>
            {prizeWinInBusd.isNaN() ? (
              <Skeleton my="7px" height={60} width={190} />
            ) : (
              <PrizeTotalBalance
                fontSize={['14px', '16px', '36px', '64px']}
                bold
                prefix="$"
                value={getBalanceNumber(prizeWinInBusd)}
                mb="8px"
                decimals={2}
              />
            )}
            <Heading mb="32px" scale="md" color="#ffffff">
              {getBalanceNumber(amountWinCollected)} GDE
            </Heading>
            <Heading mb="32px" scale="md" color="#ffffff">
              {currentPerformance?.home?.name}
            </Heading>
          </ProphesyItem>
          <ProphesyItem>
            {prizeDrawInBusd.isNaN() ? (
              <Skeleton my="7px" height={60} width={190} />
            ) : (
              <PrizeTotalBalance
                fontSize={['14px', '16px', '36px', '64px']}
                bold
                prefix="$"
                value={getBalanceNumber(prizeDrawInBusd)}
                mb="8px"
                decimals={2}
              />
            )}
            <Heading mb="32px" scale="md" color="#ffffff">
              {getBalanceNumber(amountDrawCollected)} GDE
            </Heading>
            <Heading mb="32px" scale="md" color="#ffffff">
              {t('Draw!')}
            </Heading>
          </ProphesyItem>
          <ProphesyItem>
            {prizeLosenInBusd.isNaN() ? (
              <Skeleton my="7px" height={60} width={190} />
            ) : (
              <PrizeTotalBalance
                fontSize={['14px', '16px', '36px', '64px']}
                bold
                prefix="$"
                value={getBalanceNumber(prizeLosenInBusd)}
                mb="8px"
                decimals={2}
              />
            )}
            <Heading mb="32px" scale="md" color="#ffffff">
              {getBalanceNumber(amountLoseCollected)} GDE
            </Heading>
            <Heading mb="32px" scale="md" color="#ffffff">
              {currentPerformance?.away?.name}
            </Heading>
          </ProphesyItem>
        </ProphesyRate>
      )
    }

    return (
      <Heading mb="24px" scale="xl" color="#ffffff">
        {t('Betting on live soon')}
      </Heading>
    )
  }

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center">
      <Decorations />
      <StarsDecorations display={['none', 'none', 'block']}>
        <img src="/images/lottery/star-big.png" width="124px" height="109px" alt="" />
        <img src="/images/lottery/star-small.png" width="70px" height="62px" alt="" />
        <img src="/images/lottery/three-stars.png" width="130px" height="144px" alt="" />
      </StarsDecorations>
      <Heading mb="8px" scale="md" color="#ffffff" id="lottery-hero-title">
        {t('The GianniDoge Betting Balance')}
      </Heading>
      {getHeroHeading()}
      <PerformanceHighlight performance={currentPerformance}>
        <BuyTicketsButton disabled={!processViewPerformanceOpen(currentPerformance)} />
      </PerformanceHighlight>
    </Flex>
  )
}

export default Hero
