import { useLocation } from 'react-router-dom'

export default function BackdropCredit() {
  const { pathname } = useLocation()
  if (pathname === '/social-card') return null

  return (
    <p className="backdrop-credit">
      Backdrop: Pacific Northwest dither illustration
    </p>
  )
}
