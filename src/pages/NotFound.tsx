import usePageMetadata from '../hooks/usePageMetadata'
import { Link } from 'react-router-dom'
import AdminShell from '../admin/AdminShell'
import Breadcrumbs from '../admin/Breadcrumbs'

export default function NotFound() {
  usePageMetadata('not-found')

  return (
    <AdminShell>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Page Not Found' }]} />
      <div className="content-panel ac-blade">
        <h1>Page Not Found</h1>
        <p className="hero-copy">
          The page you're looking for doesn't exist.
        </p>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </AdminShell>
  )
}
