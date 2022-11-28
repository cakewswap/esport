import { LotteryTicket, Team } from 'config/constants/types'
import { Flex, Text } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import _uniqueId from 'lodash/uniqueId'

interface TicketNumberProps extends LotteryTicket {
  localId?: number
  rewardBracket?: number
  home?: Team
}

const results = {
  1: 'Win',
  2: 'Draw',
  3: 'Lose',
}

const TicketNumber: React.FC<React.PropsWithChildren<TicketNumberProps>> = ({ localId, id, number, home }) => {
  const { t } = useTranslation()
  return (
    <Flex flexDirection="row" alignItems="center" mb="12px">
      <Flex justifyContent="space-between">
        <Text fontSize="16px" color="textSubtle">
          #{localId || id}
        </Text>
      </Flex>
      <Text key={_uniqueId()} fontSize="16px" mx="20px">
        {`${home?.name ?? ''} ${results[number]}`}
      </Text>
    </Flex>
  )
}

export default TicketNumber
