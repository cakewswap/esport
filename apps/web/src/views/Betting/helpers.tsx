import BigNumber from 'bignumber.js'
import { PerformanceResponse, PerformanceRound, PerformanceRoundUserTickets } from 'state/types'

/**
 * Remove the '1' and reverse the digits in a lottery number retrieved from the smart contract
 */
export const parseRetrievedNumber = (number: string): string => {
  const numberAsArray = number.split('')
  numberAsArray.splice(0, 1)
  numberAsArray.reverse()
  return numberAsArray.join('')
}

export const getDrawnDate = (locale: string, endTime: string) => {
  const endTimeInMs = parseInt(endTime, 10) * 1000
  const endTimeAsDate = new Date(endTimeInMs)
  return endTimeAsDate.toLocaleDateString(locale, dateTimeOptions)
}

export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

export const timeOptions: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
}

export const dateTimeOptions: Intl.DateTimeFormatOptions = {
  ...dateOptions,
  ...timeOptions,
}

export const processTicketResponse = (
  performanceData: PerformanceResponse & { userTickets?: PerformanceRoundUserTickets },
): PerformanceRound => {
  const { amountCollected: amountCollectedAsString } = performanceData

  return {
    isLoading: performanceData.isLoading,
    performanceId: performanceData.performanceId,
    userTickets: performanceData.userTickets,
    status: performanceData.status,
    home: performanceData.home,
    startTime: performanceData.startTime,
    endTime: performanceData.endTime,
    treasuryFee: performanceData.treasuryFee,
    amountCollected: amountCollectedAsString,
    finalBet: performanceData.finalBet,
  }
}
