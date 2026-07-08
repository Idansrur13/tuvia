/*
 * נתוני דמו לדשבורד הקבלן.
 * כשמתחברים ל-API אמיתי — מחליפים רק את הקובץ הזה.
 */

export const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

/* ---------- פרויקטים ויחידות ---------- */

export type UnitStatus = "available" | "reserved" | "inProcess" | "sold";

export const UNIT_STATUS: Record<
  UnitStatus,
  { label: string; badge: "primary" | "neutral" | "warning" | "success" }
> = {
  available: { label: "פנויה", badge: "primary" },
  reserved: { label: "שוריינה", badge: "neutral" },
  inProcess: { label: "בתהליך מכירה", badge: "warning" },
  sold: { label: "נמכרה", badge: "success" },
};

export interface Unit {
  id: string;
  name: string;
  rooms: number;
  sqm: number;
  price: number;
  status: UnitStatus;
  buyer?: string;
}

export interface Project {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  currency: string;
  cover: string;
  gallery: string[];
  units: Unit[];
}

export const PROJECTS: Project[] = [
  {
    id: "tlv-towers",
    name: "מגדלי תכלת",
    city: "תל אביב",
    country: "ישראל",
    flag: "🇮🇱",
    currency: "ILS",
    cover: IMG("photo-1545324418-cc1a3fa10c00"),
    gallery: [
      IMG("photo-1512917774080-9991f1c4c750"),
      IMG("photo-1522708323590-d24dbb6b0267"),
      IMG("photo-1600607687939-ce8a6c25118c"),
    ],
    units: [
      { id: "A-12", name: "דירה 12, קומה 3", rooms: 4, sqm: 108, price: 4_650_000, status: "sold", buyer: "משפחת ברקוביץ׳" },
      { id: "A-18", name: "דירה 18, קומה 5", rooms: 4, sqm: 110, price: 4_820_000, status: "sold", buyer: "רון ושירה אלמוג" },
      { id: "A-24", name: "דירה 24, קומה 7", rooms: 5, sqm: 128, price: 5_490_000, status: "inProcess", buyer: "דוד לוי" },
      { id: "B-06", name: "דירה 6, קומה 2", rooms: 3, sqm: 82, price: 3_780_000, status: "reserved", buyer: "נעמה כץ" },
      { id: "B-31", name: "פנטהאוז 31, קומה 9", rooms: 6, sqm: 210, price: 11_900_000, status: "available" },
      { id: "B-14", name: "דירה 14, קומה 4", rooms: 4, sqm: 105, price: 4_580_000, status: "available" },
    ],
  },
  {
    id: "larnaca-bay",
    name: "Blue Bay Residences",
    city: "לרנקה",
    country: "קפריסין",
    flag: "🇨🇾",
    currency: "EUR",
    cover: IMG("photo-1613490493576-7fde63acd811"),
    gallery: [
      IMG("photo-1600585154340-be6161a56a0c"),
      IMG("photo-1600566753086-00f18fb6b3ea"),
    ],
    units: [
      { id: "C-02", name: "Apt 2, Ground floor", rooms: 3, sqm: 95, price: 420_000, status: "sold", buyer: "James Miller" },
      { id: "C-08", name: "Apt 8, 2nd floor", rooms: 3, sqm: 98, price: 445_000, status: "inProcess", buyer: "אורי גולן" },
      { id: "C-11", name: "Apt 11, 3rd floor", rooms: 4, sqm: 120, price: 530_000, status: "inProcess", buyer: "Marie Dubois" },
      { id: "C-15", name: "Penthouse 15", rooms: 5, sqm: 175, price: 890_000, status: "available" },
      { id: "C-04", name: "Apt 4, 1st floor", rooms: 2, sqm: 68, price: 310_000, status: "available" },
    ],
  },
  {
    id: "miami-ocean",
    name: "Ocean View Towers",
    city: "מיאמי",
    country: "ארצות הברית",
    flag: "🇺🇸",
    currency: "USD",
    cover: IMG("photo-1512917774080-9991f1c4c750"),
    gallery: [IMG("photo-1560448204-e02f11c3d0e2")],
    units: [
      { id: "M-101", name: "Unit 101, Floor 10", rooms: 3, sqm: 115, price: 780_000, status: "sold", buyer: "Carlos Mendez" },
      { id: "M-142", name: "Unit 142, Floor 14", rooms: 4, sqm: 140, price: 1_150_000, status: "reserved", buyer: "Sarah Cohen" },
      { id: "M-201", name: "Sky Villa 201", rooms: 5, sqm: 230, price: 2_400_000, status: "available" },
      { id: "M-88", name: "Unit 88, Floor 8", rooms: 2, sqm: 85, price: 620_000, status: "available" },
    ],
  },
];

export const projectById = (projects: Project[], id: string) =>
  projects.find((p) => p.id === id);

/* ---------- לידים ---------- */

export type LeadStage = "new" | "contacted" | "visit" | "negotiation" | "paid";

export const LEAD_STAGES: { id: LeadStage; label: string; dot: string }[] = [
  { id: "new", label: "חדש", dot: "bg-primary-400" },
  { id: "contacted", label: "נוצר קשר", dot: "bg-violet-400" },
  { id: "visit", label: "סיור / פגישה", dot: "bg-warning-500" },
  { id: "negotiation", label: "משא ומתן", dot: "bg-orange-400" },
  { id: "paid", label: "שילם", dot: "bg-success-500" },
];

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  flag: string;
  projectId: string;
  unit?: string;
  stage: LeadStage;
  budget?: number;
  lastActivity: string;
}

export const LEADS: Lead[] = [
  { id: 1, name: "אבי רוזן", email: "avi@gmail.com", phone: "050-1234567", country: "ישראל", flag: "🇮🇱", projectId: "tlv-towers", stage: "new", budget: 4_500_000, lastActivity: "לפני שעה" },
  { id: 2, name: "Emma Wilson", email: "emma.w@gmail.com", phone: "+44 7700 900123", country: "בריטניה", flag: "🇬🇧", projectId: "larnaca-bay", stage: "new", budget: 400_000, lastActivity: "לפני 3 שעות" },
  { id: 3, name: "דוד לוי", email: "david.l@gmail.com", phone: "052-9876543", country: "ישראל", flag: "🇮🇱", projectId: "tlv-towers", unit: "A-24", stage: "negotiation", budget: 5_500_000, lastActivity: "אתמול" },
  { id: 4, name: "Marie Dubois", email: "marie.d@outlook.com", phone: "+33 6 12 34 56 78", country: "צרפת", flag: "🇫🇷", projectId: "larnaca-bay", unit: "C-11", stage: "negotiation", budget: 550_000, lastActivity: "לפני יומיים" },
  { id: 5, name: "אורי גולן", email: "uri.g@gmail.com", phone: "054-5551234", country: "ישראל", flag: "🇮🇱", projectId: "larnaca-bay", unit: "C-08", stage: "paid", budget: 445_000, lastActivity: "לפני שבוע" },
  { id: 6, name: "Carlos Mendez", email: "carlos.m@gmail.com", phone: "+1 305 555 0134", country: "ארצות הברית", flag: "🇺🇸", projectId: "miami-ocean", unit: "M-101", stage: "paid", budget: 780_000, lastActivity: "לפני שבועיים" },
  { id: 7, name: "Hans Becker", email: "hans.b@web.de", phone: "+49 151 23456789", country: "גרמניה", flag: "🇩🇪", projectId: "miami-ocean", stage: "contacted", budget: 900_000, lastActivity: "לפני 5 שעות" },
  { id: 8, name: "נעמה כץ", email: "naama.k@gmail.com", phone: "053-7778888", country: "ישראל", flag: "🇮🇱", projectId: "tlv-towers", unit: "B-06", stage: "visit", budget: 3_800_000, lastActivity: "היום" },
  { id: 9, name: "Sarah Cohen", email: "sarah.c@gmail.com", phone: "+1 917 555 0182", country: "ארצות הברית", flag: "🇺🇸", projectId: "miami-ocean", unit: "M-142", stage: "visit", budget: 1_200_000, lastActivity: "אתמול" },
];

/* ---------- הזמנות לקוחות ---------- */

export interface Invite {
  id: number;
  name: string;
  email: string;
  projectId: string;
  sentAt: string;
  status: "pending" | "joined";
}

export const INVITES: Invite[] = [
  { id: 1, name: "רון ושירה אלמוג", email: "ron.almog@gmail.com", projectId: "tlv-towers", sentAt: "12.06.2026", status: "joined" },
  { id: 2, name: "James Miller", email: "j.miller@gmail.com", projectId: "larnaca-bay", sentAt: "28.06.2026", status: "joined" },
  { id: 3, name: "ליאת שמעוני", email: "liat.sh@gmail.com", projectId: "tlv-towers", sentAt: "05.07.2026", status: "pending" },
];
