import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROUTES = {
  owner:     '/owner/dashboard',
  manager:   '/manager/dashboard',
  team_lead: '/teamlead/dashboard',
  developer: '/developer/dashboard',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    navigate(ROUTES[user?.role] || '/role-select', { replace: true })
  }, [user])
  return null
}
