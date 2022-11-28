import { fromUnixTime, format } from 'date-fns'
import styled from 'styled-components'
import ReactCountryFlag from 'react-country-flag'
import { Box } from '@pancakeswap/uikit'

const TeamWrapper = styled.div`
  flex: 1;
  display: flex;
  text-align: center;
  flex-direction: column;
`

const PerformanceWrapper = styled(Box)`
  background-color: #f0f3f7;
  border-radius: 4px;
  border-top: 0;
  cursor: pointer;
  overflow: hidden;
  padding: 1px;
  border: 1px solid;
`

const PerformanceHeader = styled.div`
  background-color: #f0f3f7;
  color: #1f2533;
  font-size: 16px;
  font-weight: 700;
  line-height: 16px;
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 20px;
`

const PerformanceCompetion = styled.div`
  align-items: center;
  background-color: #fff;
  border-radius: 0 0 4px 4px;
  color: #1f2533;
  display: flex;
  font-size: 16px;
  font-weight: 700;
  justify-content: center;
  line-height: 16px;
  margin: -1px auto 0;
  padding: 20px 40px;
  position: relative;
`

const TeamName = styled.span`
  color: #1f2533;
  font-size: 20px;
  line-height: 24px;
  font-weight: 700;
  line-height: 20px;
  margin-top: 12px;
  text-align: center;
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

export const PerformanceHighlight = ({ performance, children }) => {
  if (!performance?.startTime) {
    return undefined
  }

  const startTime = fromUnixTime(performance?.startTime)

  return (
    <PerformanceWrapper minWidth={[null, '300px', '400px', '400px']}>
      <PerformanceHeader>
        <span className="">#{performance.performanceId}</span>
        <Line />
        <span className="">{format(startTime, 'MM/dd, HH:mm')}</span>
        <Line />
        <span className="">Group Match</span>
      </PerformanceHeader>
      <PerformanceCompetion>
        <TeamWrapper>
          <ReactCountryFlag
            countryCode={performance?.home?.flag}
            style={{
              fontSize: '2.5em',
            }}
          />
          <TeamName>{performance?.home?.name}</TeamName>
        </TeamWrapper>
        <VS>VS</VS>
        <TeamWrapper>
          <ReactCountryFlag
            countryCode={performance?.away?.flag}
            style={{
              fontSize: '2.5em',
            }}
          />
          <TeamName>{performance?.away?.name}</TeamName>
        </TeamWrapper>
      </PerformanceCompetion>
      <PerformanceCompetion>{children}</PerformanceCompetion>
    </PerformanceWrapper>
  )
}
