/*
 * מטא-דאטה משותפת למסכי האדמין — תוויות ותגי סטטוס.
 * באותה רוח של LEAD_STAGE_META / UNIT_STATUS_META ב-app/data/meta.ts,
 * אבל עם מפתחות מילון (DictKey) כי אלו מחרוזות ממשק, לא תוכן.
 */
import type { BadgeProps } from '../ui'
import type { DictKey } from '~/i18n/dictionary'
import type {
  OrganizationType,
  PartnerApplicationStatus,
  PaymentApprovalStatus,
  ProjectStatus,
  Role,
  UserStatus,
} from '~/types'

type BadgeVariant = NonNullable<BadgeProps['variant']>

export const ORG_TYPE_LABEL: Record<OrganizationType, DictKey> = {
  contractor: 'roleContractor',
  agency: 'orgTypeAgency',
}

export const ROLE_LABELS: Record<Role, DictKey> = {
  client: 'roleClient',
  contractor: 'roleContractor',
  seller: 'roleSeller',
  admin: 'roleAdmin',
}

export const APP_STATUS_META: Record<
  PartnerApplicationStatus,
  { label: DictKey; badge: BadgeVariant }
> = {
  pending: { label: 'appStatusPending', badge: 'warning' },
  approved: { label: 'appStatusApproved', badge: 'success' },
  rejected: { label: 'appStatusRejected', badge: 'danger' },
}

export const USER_STATUS_META: Record<
  UserStatus,
  { label: DictKey; badge: BadgeVariant }
> = {
  active: { label: 'usrStatusActive', badge: 'success' },
  invited: { label: 'usrStatusInvited', badge: 'warning' },
  suspended: { label: 'usrStatusSuspended', badge: 'danger' },
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: DictKey; badge: BadgeVariant }
> = {
  draft: { label: 'projStatusDraft', badge: 'neutral' },
  pending: { label: 'projStatusPending', badge: 'warning' },
  published: { label: 'projStatusPublished', badge: 'success' },
  archived: { label: 'projStatusArchived', badge: 'neutral' },
}

export const APPROVAL_STATUS_META: Record<
  PaymentApprovalStatus,
  { label: DictKey; badge: BadgeVariant }
> = {
  requested: { label: 'payStatusRequested', badge: 'neutral' },
  contractorApproved: { label: 'payStatusContractorApproved', badge: 'warning' },
  adminConfirmed: { label: 'payStatusAdminConfirmed', badge: 'success' },
  rejected: { label: 'payStatusRejected', badge: 'danger' },
}
