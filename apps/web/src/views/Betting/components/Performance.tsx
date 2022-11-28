import { Flex } from '@pancakeswap/uikit'
import { PerformanceStatus } from 'config/constants/types'
import { fromUnixTime, format } from 'date-fns'
import styled from 'styled-components'

const TeamWrapper = styled(Flex)`
  text-align: center;
`

const PerformanceWrapper = styled(Flex)<{ activated?: boolean }>`
  background-color: ${({ activated }) => (activated ? 'var(--colors-primary)' : 'var(--colors-secondary)')};
  border-radius: 4px;
  border-top: 0;
  cursor: pointer;
  overflow: hidden;
  padding: 1px;
  border: 1px solid ${({ activated }) => (activated ? 'var(--colors-primary)' : 'var(--colors-secondary)')};
  width: 100%;
`

const PerformanceHeader = styled.div`
  background-color: #f0f3f7;
  color: #1f2533;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  padding: 4px 0;
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 8px 0;
`

const PerformanceCompetion = styled(Flex)`
  align-items: center;
  background-color: #fff;
  border-radius: 0 0 4px 4px;
  color: #1f2533;
  display: flex;
  font-size: 12px;
  font-weight: 700;
  justify-content: center;
  line-height: 16px;
  margin: -1px auto 0;
  padding: 6px 10px 8px;
  position: relative;
`

const TeamName = styled(Flex)`
  color: #1f2533;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  justify-content: center;
`

const Line = styled.span`
  background-color: #aab1bf;
  height: 12px;
  margin: 0 6px;
  width: 1px;
`

const VS = styled.span`
  margin: 0 24px;
`

export const Performance = ({ performance, activated, ...props }) => {
  const startTime = fromUnixTime(performance?.startTime)
  const isGoal = performance.status === PerformanceStatus.CLAIMABLE

  return (
    <PerformanceWrapper activated={activated} flexDirection="column" {...props}>
      <PerformanceHeader>
        <span className="">#{performance.performanceId}</span>
        <Line />
        <span className="">{format(startTime, 'MM/dd, HH:mm')}</span>
        <Line />
        <span className="">Group Match</span>
      </PerformanceHeader>
      <PerformanceCompetion flex="1" width="100%">
        <TeamWrapper flexDirection="column">
          {isGoal && <TeamName>{performance.homeGoal}</TeamName>}
          <TeamName my="12px">{performance?.home?.name}</TeamName>
        </TeamWrapper>
        <VS>VS</VS>
        <TeamWrapper flexDirection="column">
          {isGoal && <TeamName>{performance.performanceId === '7' ? 1 : performance.awayGoal}</TeamName>}
          <TeamName my="12px">{performance?.away?.name}</TeamName>
        </TeamWrapper>
      </PerformanceCompetion>
    </PerformanceWrapper>
  )
}
