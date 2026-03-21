import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import RoleSelect from './pages/RoleSelect'
import RoleLogin from './pages/RoleLogin'
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerMyTasks from './pages/manager/MyTasks'
import ManagerTeam from './pages/manager/Team'
import TeamLeadDashboard from './pages/teamlead/Dashboard'
import TeamLeadMyTasks from './pages/teamlead/MyTasks'
import DeveloperDashboard from './pages/developer/Dashboard'
import DeveloperMyTasks from './pages/developer/MyTasks'
import OwnerDashboard from './pages/owner/Dashboard'
import AllUsersPage from './pages/owner/AllUsers'
import AllTasksPage from './pages/owner/AllTasks'
import TaskDetailPage from './pages/TaskDetail'

const ROLE_ROUTES = {
  owner: '/owner/dashboard',
  manager: '/manager/dashboard',
  team_lead: '/teamlead/dashboard',
  developer: '/developer/dashboard',
}

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#030308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/role-select" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_ROUTES[user.role] || '/role-select'} replace />
  }
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to={ROLE_ROUTES[user.role] || '/role-select'} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/role-select" element={<PublicRoute><RoleSelect /></PublicRoute>} />
          <Route path="/login/:role" element={<PublicRoute><RoleLogin /></PublicRoute>} />

          {/* Owner */}
          <Route path="/owner/dashboard" element={<PrivateRoute allowedRoles={['owner']}><OwnerDashboard /></PrivateRoute>} />
          <Route path="/owner/users"     element={<PrivateRoute allowedRoles={['owner']}><AllUsersPage /></PrivateRoute>} />
          <Route path="/owner/tasks"     element={<PrivateRoute allowedRoles={['owner']}><AllTasksPage /></PrivateRoute>} />

          {/* Manager */}
          <Route path="/manager/dashboard" element={<PrivateRoute allowedRoles={['manager']}><ManagerDashboard /></PrivateRoute>} />
          <Route path="/manager/tasks"     element={<PrivateRoute allowedRoles={['manager']}><ManagerMyTasks /></PrivateRoute>} />
          <Route path="/manager/team"      element={<PrivateRoute allowedRoles={['manager']}><ManagerTeam /></PrivateRoute>} />

          {/* Team Lead */}
          <Route path="/teamlead/dashboard" element={<PrivateRoute allowedRoles={['team_lead']}><TeamLeadDashboard /></PrivateRoute>} />
          <Route path="/teamlead/tasks"     element={<PrivateRoute allowedRoles={['team_lead']}><TeamLeadMyTasks /></PrivateRoute>} />

          {/* Developer */}
          <Route path="/developer/dashboard" element={<PrivateRoute allowedRoles={['developer']}><DeveloperDashboard /></PrivateRoute>} />
          <Route path="/developer/tasks"     element={<PrivateRoute allowedRoles={['developer']}><DeveloperMyTasks /></PrivateRoute>} />

          {/* Task Detail */}
          <Route path="/tasks/:id" element={<PrivateRoute allowedRoles={['owner', 'manager', 'team_lead', 'developer']}><TaskDetailPage /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
