/*
 * פרויקטים ושריונים — מלאי הקבלן המסונכרן (פרקים 5, 8).
 * הפרויקט הוא אוסף רזה; היחידות עצמן יושבות בקולקשן האחד ב-units.ts.
 */
import type { Project, Reservation } from '~/types'
import { L, stamp } from './util'
import { unitsOfProject } from './units'

export const PROJECTS: Project[] = [
  {
    id: 'tlv-towers',
    contractorId: 'org-tchelet',
    status: 'published',
    name: L('מגדלי תכלת', 'Tchelet Towers'),
    description: L(
      'פרויקט יוקרה בלב תל אביב',
      'A luxury project in the heart of Tel Aviv',
    ),
    units: unitsOfProject('tlv-towers'),
    ...stamp('2025-06-01', '2026-07-01'),
  },
  {
    id: 'larnaca-bay',
    contractorId: 'org-bluebay',
    status: 'published',
    name: L('מפרץ לרנקה', 'Blue Bay Residences'),
    units: unitsOfProject('larnaca-bay'),
    ...stamp('2025-08-10', '2026-06-20'),
  },
  {
    id: 'miami-ocean',
    contractorId: 'org-bluebay',
    status: 'pending',
    name: L('אושן ויו', 'Ocean View Towers'),
    units: unitsOfProject('miami-ocean'),
    ...stamp('2026-01-15'),
  },
]

/** שריונים פעילים על ציר קבלן↔מוכר (פרק 8.1). */
export const RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    unitId: 'B-06',
    projectId: 'tlv-towers',
    sellerId: 'u-michal',
    clientId: 'u-ron',
    status: 'approved',
    expiresAt: '2026-07-20T00:00:00Z',
    ...stamp('2026-07-08'),
  },
  {
    id: 'res-2',
    unitId: 'M-142',
    projectId: 'miami-ocean',
    sellerId: 'u-david-seller',
    status: 'requested',
    expiresAt: '2026-07-15T00:00:00Z',
    note: 'ממתין לאישור הקבלן',
    ...stamp('2026-07-06'),
  },
]

/** שליפת פרויקט לפי מזהה. */
export const projectById = (id?: string) => PROJECTS.find((p) => p.id === id)
