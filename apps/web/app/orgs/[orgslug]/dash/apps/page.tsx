'use client'
import IntegratedApps from '@components/Dashboard/Pages/IntegratedApps/IntegratedApps'
import AdminOnly from '@components/Dashboard/Pages/IntegratedApps/AdminOnly'

export default function IntegratedAppsPage() {
  return (
    <AdminOnly>
      <IntegratedApps />
    </AdminOnly>
  )
}
