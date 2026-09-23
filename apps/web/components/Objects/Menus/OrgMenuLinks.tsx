import { useOrg } from '@components/Contexts/OrgContext'
import { getUriWithOrg } from '@services/config/config'
import { Books, FolderSimple, ChatsCircle, Headphones, Cube, ShoppingBag } from '@phosphor-icons/react'
import { menuIcon } from '@components/Objects/Menus/menuIcons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { getMenuColorClasses } from '@services/utils/ts/colorUtils'

// `sections` are the path prefixes that belong to the item, for its active state.
type Builtin = { feature: string; link: string; labelKey: string; Icon: any; sections?: string[] }

const BUILTIN: Record<string, Builtin> = {
  courses: { feature: 'courses', link: '/courses', labelKey: 'courses.courses', Icon: Books, sections: ['/courses', '/course/'] },
  library: { feature: 'folders', link: '/library', labelKey: 'library.library', Icon: FolderSimple },
  podcasts: { feature: 'podcasts', link: '/podcasts', labelKey: 'podcasts.podcasts', Icon: Headphones },
  communities: { feature: 'communities', link: '/communities', labelKey: 'communities.title', Icon: ChatsCircle },
  playgrounds: { feature: 'playgrounds', link: '/playgrounds', labelKey: 'common.playgrounds', Icon: Cube },
  store: { feature: 'payments', link: '/store', labelKey: 'common.store', Icon: ShoppingBag },
}

// Default order when an org has no custom menu config.
const DEFAULT_ORDER = ['courses', 'library', 'podcasts', 'communities', 'playgrounds', 'store']

function MenuLinks(props: { orgslug: string; primaryColor?: string }) {
  const { t } = useTranslation()
  const org = useOrg() as any
  const colors = getMenuColorClasses(props.primaryColor || '')
  const pathname = usePathname() ?? ''

  const rf = org?.config?.config?.resolved_features
  const isEnabled = (feature: string) => rf?.[feature]?.enabled === true

  const configItems: any[] | undefined =
    org?.config?.config?.customization?.menu?.items ?? org?.config?.config?.general?.menu?.items

  // Build the items to render (config-driven, else feature-driven defaults)
  const source =
    configItems && configItems.length
      ? [...configItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : DEFAULT_ORDER.map((type, i) => ({ type, enabled: true, order: i, label: '', url: '' }))

  const rendered = source
    .map((item: any) => {
      if (item.type === 'custom') {
        if (!item.enabled || !item.url) return null
        const external = /^https?:\/\//i.test(item.url)
        return {
          key: `custom-${item.url}`,
          label: item.label || item.url,
          Icon: menuIcon(item.icon),
          href: external ? item.url : getUriWithOrg(props.orgslug, item.url),
          external,
        }
      }
      const meta = BUILTIN[item.type]
      if (!meta) return null
      if (!item.enabled) return null
      if (!isEnabled(meta.feature)) return null // plan/feature gating
      return {
        key: item.type,
        label: item.label || t(meta.labelKey),
        Icon: meta.Icon,
        href: getUriWithOrg(props.orgslug, meta.link),
        external: false,
        active: (meta.sections ?? [meta.link]).some((p) => pathname === p || pathname.startsWith(p.endsWith('/') ? p : `${p}/`)),
      }
    })
    .filter(Boolean) as any[]

  return (
    <ul className="flex items-center gap-1">
      {rendered.map((it) => {
        const className = `group flex h-9 items-center gap-2 rounded-[3px] px-3 font-semibold transition-colors duration-150 motion-reduce:transition-none ${
          it.active ? colors.navLinkActive : colors.navLink
        }`
        const content = (
          <>
            <it.Icon
              size={20}
              weight={it.active ? 'fill' : 'duotone'}
              aria-hidden="true"
              className={`transition-colors duration-150 ${it.active ? colors.navIconActive : colors.navIcon}`}
            />
            <span>{it.label}</span>
          </>
        )
        return (
          <li key={it.key}>
            {it.external ? (
              <a href={it.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
            ) : (
              <Link href={it.href} className={className} aria-current={it.active ? 'page' : undefined}>{content}</Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default MenuLinks
