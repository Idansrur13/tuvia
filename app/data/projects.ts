/*
 * פרויקטים, יחידות ושריונים — מלאי הקבלן המסונכרן (פרקים 5, 8).
 */
import type { Project, Reservation } from '~/types'
import { COUNTRIES, L, img, money, stamp } from './util'

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
    address: {
      country: COUNTRIES.IL,
      city: 'תל אביב',
      neighborhood: 'הצפון הישן',
      point: { lat: 32.0853, lng: 34.7818 },
    },
    cover: img('photo-1545324418-cc1a3fa10c00'),
    gallery: [
      img('photo-1512917774080-9991f1c4c750'),
      img('photo-1522708323590-d24dbb6b0267'),
      img('photo-1600607687939-ce8a6c25118c'),
    ],
    ...stamp('2025-06-01', '2026-07-01'),
    units: [
      {
        id: 'A-12',
        projectId: 'tlv-towers',
        name: 'דירה 12, קומה 3',
        rooms: 4,
        sqm: 108,
        floor: '3',
        price: money(4_650_000, 'ILS'),
        status: 'sold',
        buyerId: 'u-ron',
        ...stamp('2025-06-01', '2026-06-15'),
      },
      {
        id: 'A-24',
        projectId: 'tlv-towers',
        name: 'דירה 24, קומה 7',
        rooms: 5,
        sqm: 128,
        floor: '7',
        price: money(5_490_000, 'ILS'),
        status: 'inProcess',
        ...stamp('2025-06-01', '2026-07-05'),
      },
      {
        id: 'B-06',
        projectId: 'tlv-towers',
        name: 'דירה 6, קומה 2',
        rooms: 3,
        sqm: 82,
        floor: '2',
        price: money(3_780_000, 'ILS'),
        status: 'reserved',
        reservationId: 'res-1',
        ...stamp('2025-06-01', '2026-07-08'),
      },
      {
        id: 'B-31',
        projectId: 'tlv-towers',
        name: 'פנטהאוז 31, קומה 9',
        rooms: 6,
        sqm: 210,
        floor: '9',
        price: money(11_900_000, 'ILS'),
        status: 'available',
        ...stamp('2025-06-01'),
      },
    ],
  },
  {
    id: 'larnaca-bay',
    contractorId: 'org-bluebay',
    status: 'published',
    name: L('מפרץ לרנקה', 'Blue Bay Residences'),
    address: {
      country: COUNTRIES.CY,
      city: 'Larnaca',
      point: { lat: 34.9182, lng: 33.632 },
    },
    cover: img('photo-1613490493576-7fde63acd811'),
    gallery: [
      img('photo-1600585154340-be6161a56a0c'),
      img('photo-1600566753086-00f18fb6b3ea'),
    ],
    ...stamp('2025-08-10', '2026-06-20'),
    units: [
      {
        id: 'C-08',
        projectId: 'larnaca-bay',
        name: 'Apt 8, 2nd floor',
        rooms: 3,
        sqm: 98,
        floor: '2',
        price: money(445_000, 'EUR'),
        status: 'inProcess',
        ...stamp('2025-08-10', '2026-07-02'),
      },
      {
        id: 'C-15',
        projectId: 'larnaca-bay',
        name: 'Penthouse 15',
        rooms: 5,
        sqm: 175,
        floor: '5',
        price: money(890_000, 'EUR'),
        status: 'available',
        priceHistory: [
          {
            at: '2026-07-08T09:00:00Z',
            from: money(920_000, 'EUR'),
            to: money(890_000, 'EUR'),
            changedBy: 'import',
          },
        ],
        ...stamp('2025-08-10', '2026-07-08'),
      },
    ],
  },
  {
    id: 'miami-ocean',
    contractorId: 'org-bluebay',
    status: 'pending',
    name: L('אושן ויו', 'Ocean View Towers'),
    address: {
      country: COUNTRIES.US,
      city: 'Miami',
      point: { lat: 25.7617, lng: -80.1918 },
    },
    cover: img('photo-1512917774080-9991f1c4c750'),
    gallery: [img('photo-1560448204-e02f11c3d0e2')],
    ...stamp('2026-01-15'),
    units: [
      {
        id: 'M-142',
        projectId: 'miami-ocean',
        name: 'Unit 142, Floor 14',
        rooms: 4,
        sqm: 140,
        floor: '14',
        price: money(1_150_000, 'USD'),
        status: 'reserved',
        reservationId: 'res-2',
        ...stamp('2026-01-15', '2026-07-06'),
      },
      {
        id: 'M-201',
        projectId: 'miami-ocean',
        name: 'Sky Villa 201',
        rooms: 5,
        sqm: 230,
        floor: '20',
        price: money(2_400_000, 'USD'),
        status: 'available',
        priceHistory: [
          {
            at: '2026-07-06T08:00:00Z',
            from: money(2_550_000, 'USD'),
            to: money(2_400_000, 'USD'),
            changedBy: 'u-mike',
          },
        ],
        ...stamp('2026-01-15', '2026-07-06'),
      },
    ],
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

/** שליפת יחידה לפי מזהה מכל הפרויקטים. */
export const unitById = (id: string) =>
  PROJECTS.flatMap((p) => p.units).find((u) => u.id === id)
