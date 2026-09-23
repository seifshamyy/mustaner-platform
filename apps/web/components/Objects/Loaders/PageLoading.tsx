'use client'
import { useTranslation } from 'react-i18next'
import Assemble from './Assemble'

/** A page on its way. Fades in after a short delay, so fast loads never flash it. */
function PageLoading() {
  const { t } = useTranslation()
  return (
    <div className="mst-page-loading fixed inset-0 flex items-center justify-center">
      <Assemble height={40} label={t('common.loading', { defaultValue: 'Loading' })} />
    </div>
  )
}

export default PageLoading
