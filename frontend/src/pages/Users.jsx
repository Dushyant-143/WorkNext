import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Users management is handled inside Owner Dashboard. Redirect accordingly.
export default function UsersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (user?.role === 'owner') navigate('/owner/users', { replace: true })
    else navigate('/role-select', { replace: true })
  }, [user])
  return null
}
