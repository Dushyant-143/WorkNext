import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// This page is replaced by RoleLogin. Redirect to role-select.
export default function Login() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/role-select', { replace: true }) }, [])
  return null
}
