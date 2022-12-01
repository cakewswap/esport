import styled from 'styled-components'
import { Modal } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import { PerformanceStatus } from 'config/constants/types'
import { usePerformance } from 'state/bet/hooks'
import useTheme from 'hooks/useTheme'
import PreviousRoundTicketsInner from './PreviousRoundTicketsInner'
import CurrentRoundTicketsInner from './CurrentRoundTicketsInner'

const StyledModal = styled(Modal)`
  ${({ theme }) => theme.mediaQueries.md} {
    width: 280px;
  }
`

interface ViewTicketsModalProps {
  performanceId: string
  roundStatus?: PerformanceStatus
  onDismiss?: () => void
}

const ViewTicketsModal: React.FC<React.PropsWithChildren<ViewTicketsModalProps>> = ({
  onDismiss,
  performanceId,
  roundStatus,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { currentPerformanceId } = usePerformance()
  const isPreviousRound =
    roundStatus?.toLowerCase() === PerformanceStatus.CLAIMABLE || performanceId !== currentPerformanceId

  return (
    <StyledModal
      title={`${t('Match')} #${performanceId}`}
      onDismiss={onDismiss}
      headerBackground={theme.colors.gradientCardHeader}
    >
      {isPreviousRound ? <PreviousRoundTicketsInner performanceId={performanceId} /> : <CurrentRoundTicketsInner />}
    </StyledModal>
  )
}

export default ViewTicketsModal
