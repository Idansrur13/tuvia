import type { Variants } from 'motion/react'

/*
 * Variants גלובליים לאנימציות — משתמשים בהם בכל האתר
 * כדי לשמור על שפת תנועה אחידה ולא להגדיר אנימציות פעמיים.
 *
 * שימוש טיפוסי:
 *   <motion.div variants={stagger} initial='hidden' animate='visible'>
 *     <motion.div variants={fadeUp}>...</motion.div>
 *   </motion.div>
 */

const easeOut = [0.22, 0.61, 0.36, 1] as const

/** כניסה מלמטה עם דהייה — הכניסה הסטנדרטית של האתר */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
}

/** כניסה מלמעלה — להדרים ובאנרים עליונים */
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeOut },
  },
}

/** דהייה בלבד — לרקעים ותוכן משני */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

/** כניסה עם זום עדין — לכרטיסים ומודאלים */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: easeOut },
  },
}

/** קונטיינר שמדרג את כניסת הילדים — הילדים מקבלים variants משלהם */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

/** יציאה אחידה לפריטים שמסוננים החוצה (AnimatePresence) */
export const cardExit = {
  opacity: 0,
  scale: 0.95,
  transition: { duration: 0.2, ease: 'easeIn' },
} as const

/** הגדרת viewport אחידה ל-whileInView — פעם אחת, קצת לפני שנכנס למסך */
export const viewportOnce = { once: true, margin: '-60px' } as const

/** קפיץ סטנדרטי לאינטראקציות (קרוסלה, גרירה) */
export const spring = { type: 'spring', stiffness: 260, damping: 30 } as const
