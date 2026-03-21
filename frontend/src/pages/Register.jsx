import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Public registration is disabled. Owner creates users from the Owner Dashboard.
export default function Register() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/role-select', { replace: true }) }, [])
  return null
}
