import { useEffect, useState } from 'react'
import { Flex, FlexProps } from '@pancakeswap/uikit'
import random from 'lodash/random'
import uniqueId from 'lodash/uniqueId'
import { parseRetrievedNumber } from '../helpers'
import { BallWithNumber } from '../svgs'
import { BallColor } from '../svgs/Balls'

interface WinningNumbersProps extends FlexProps {
  number: string
  size?: string
  fontSize?: string
  rotateText?: boolean
}

const results = {
  1: 'Win',
  2: 'Draw',
  3: 'Lose',
}

const WinningNumbers: React.FC<React.PropsWithChildren<WinningNumbersProps>> = ({
  number,
  rotateText,
  ...containerProps
}) => {
  const [rotationValues, setRotationValues] = useState([])
  const reversedNumber = parseRetrievedNumber(number)
  const numAsArray = reversedNumber.split('')

  useEffect(() => {
    if (rotateText && numAsArray && rotationValues.length === 0) {
      setRotationValues(numAsArray.map(() => random(-30, 30)))
    }
  }, [rotateText, numAsArray, rotationValues])

  return (
    <Flex justifyContent="space-between" {...containerProps}>
      {results[number]}
    </Flex>
  )
}

export default WinningNumbers
