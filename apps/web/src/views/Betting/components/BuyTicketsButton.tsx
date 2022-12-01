import { Button, useModal, WaitIcon, ButtonProps } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import { usePerformance } from 'state/bet/hooks'
import { PerformanceStatus } from 'config/constants/types'
import ProphecyModal from './ProphecyModal/ProphecyModal'

interface ProphecyButtonProps extends ButtonProps {
  disabled?: boolean
}

const ProphecyButton: React.FC<React.PropsWithChildren<ProphecyButtonProps>> = ({ disabled, ...props }) => {
  const { t } = useTranslation()
  const [onPresentProphecyModal] = useModal(<ProphecyModal />)
  const {
    currentPerformance: { status, startTime },
  } = usePerformance()

  const getBuyButtonText = () => {
    if (status === PerformanceStatus.OPEN) {
      return t('Bet Now')
    }

    if (status === PerformanceStatus.PENDING) {
      return t('Bet Soon')
    }

    if (status === PerformanceStatus.CLOSE || parseInt(startTime, 10) <= Date.now()) {
      return t('Match started')
    }

    return (
      <>
        <WaitIcon mr="4px" color="textDisabled" /> {t('Over!')}
      </>
    )
  }

  return (
    <Button {...props} disabled={disabled} onClick={onPresentProphecyModal}>
      {getBuyButtonText()}
    </Button>
  )
}

export default ProphecyButton
