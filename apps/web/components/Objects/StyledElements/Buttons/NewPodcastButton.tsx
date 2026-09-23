'use client'
import { useTranslation } from 'react-i18next'
import { createButtonClass, CreateButtonLabel } from './CreateButton'

interface NewPodcastButtonProps {
  disabled?: boolean
}

function NewPodcastButton({ disabled = false }: NewPodcastButtonProps) {
  const { t } = useTranslation()
  return (
    <div className={`${createButtonClass} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <CreateButtonLabel label={t('podcasts.new_podcast')} />
    </div>
  )
}

export default NewPodcastButton
