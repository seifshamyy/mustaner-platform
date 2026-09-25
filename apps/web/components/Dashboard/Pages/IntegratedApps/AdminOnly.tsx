'use client'
import React from 'react'
import useAdminStatus from '@components/Hooks/useAdminStatus'
import PageLoading from '@components/Objects/Loaders/PageLoading'
import ErrorUI from '@components/Objects/StyledElements/Error/Error'

/** Integrated apps are for the organization's Admins, like the rest of the org's management. */
export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { canManageOrg, loading } = useAdminStatus()
  if (loading) return <PageLoading />
  if (!canManageOrg) return <ErrorUI error={{ status: 403, message: 'admin_only' }} />
  return <>{children}</>
}
