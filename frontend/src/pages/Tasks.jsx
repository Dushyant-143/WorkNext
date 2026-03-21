import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import Modal from '../components/Modal'
import api from '../api/axios'
import { Plus, Search, Filter } from 'lucide-react'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignee: '' })
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to_teamlead_id: '' })
  const [saving, setSaving] = useState(false)

  const fetchTasks = async () => {
    const params = {}
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.assignee) params.assignee = filters.assignee
    const res = await api.get('/tasks/', { params })
    setTasks(res.data.results || res.data)
  }

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    if (user?.role === 'owner') {
      api.get('/auth/users/').then(res => setUsers(res.data.results || res.data))
    }
  }, [user])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks/', form)
      setModalOpen(false)
      setForm({ title: '', description: '', priority: 'medium', due_date: '', assigned_to_teamlead_id: '' })
      fetchTasks()
    } catch (err) {
      alert('Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks found</p>
          </div>
          {['owner', 'manager'].includes(user?.role) && (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> New Task
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search tasks..." value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="flex-1 text-sm outline-none text-gray-700" />
          </div>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No tasks found</p>
            <p className="text-gray-300 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Task title" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3} placeholder="Task description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select value={form.assigned_to_teamlead_id} onChange={e => setForm({ ...form, assigned_to_teamlead_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
