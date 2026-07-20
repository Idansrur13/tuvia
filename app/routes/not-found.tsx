import { data, Link, useNavigate } from 'react-router'
import { Button } from '~/components/ui'
import underConstruction from '~/assets/icons/undraw_under-construction_c2y1.svg'

export function loader() {
  return data('עמוד לא נמצא', { status: 404 })
  //   if (!listing) throw data('הנכס לא נמצא', { status: 404 })
}
export default function PageNotFound() {
  const navigate = useNavigate()
  return (
    <>
      <div className='min-h-screen relative flex flex-col items-center justify-center text-center px-6 gap-6'>
        <img src={underConstruction} alt='' className='fixed opacity-60' />

        <div className='z-1 flex flex-col gap-4 items-center'>
          <h1 className='text-8xl font-bold text-primary-400'>404</h1>
          <h2 className='text-5xl '>הדף לא נמצא</h2>
          <p className=''>הקישור שפתחת לא קיים או הוסר. חזרו לדף הבית.</p>

          <Button onClick={() => navigate(-1)}> ← חזרה לדף הבית </Button>
        </div>
      </div>
    </>
  )
}
