'use client'
import { useTranslation } from 'react-i18next'
import { createButtonClass, CreateButtonLabel } from './CreateButton'

interface NewCourseButtonProps {
  disabled?: boolean
}

function NewCourseButton({ disabled = false }: NewCourseButtonProps) {
  const { t } = useTranslation()
  return (
    <div className={`${createButtonClass} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <CreateButtonLabel label={t('courses.new_course')} />
    </div>
  )
}

export default NewCourseButton
