'use client'
import { use } from 'react'
import { notFound } from 'next/navigation'
import AdminOnly from '@components/Dashboard/Pages/IntegratedApps/AdminOnly'
import { CustomAppFrame, WebsiteEditorFrame } from '@components/Dashboard/Pages/IntegratedApps/AppFrame'

export default function IntegratedAppPage(props: { params: Promise<{ appid: string; orgslug: string }> }) {
  const { appid } = use(props.params)
  const id = Number(appid)
  if (appid !== 'website' && !(Number.isInteger(id) && id > 0)) notFound()
  return <AdminOnly>{appid === 'website' ? <WebsiteEditorFrame /> : <CustomAppFrame id={id} />}</AdminOnly>
}
