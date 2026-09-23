'use client'
import { useTranslation } from 'react-i18next'
import Assemble from './Assemble'

type LearnHouseSpinnerProps = {
  /** Height in px. Below 32 there is only room for «م», so the monogram is drawn. */
  size?: number
  tone?: 'brand' | 'white'
  className?: string
}

function LearnHouseSpinner({ size = 44, tone = 'brand', className = '' }: LearnHouseSpinnerProps) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <Assemble
        shape={size < 32 ? 'monogram' : 'wordmark'}
        height={size < 32 ? size : Math.round(size * 0.7)}
        tone={tone}
        label={t('common.loading', { defaultValue: 'Loading' })}
      />
    </span>
  )
}

export default LearnHouseSpinner
