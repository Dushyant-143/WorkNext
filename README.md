# WorkNext — Role-Based Task Management

> Manage Roles. Own Tasks. Flow Together.

A full-stack task management application built with Django REST Framework and React.

**Developed by [Dushyant Kumar](https://github.com/Dushyant-143)**

---

## Tech Stack

**Backend:** Python 3.11, Django 4.2, Django REST Framework  
**Frontend:** React 18, Vite, Tailwind CSS, Axios  
**Database:** SQLite (dev) / PostgreSQL (production)  
**Auth:** JWT (Access + Refresh Token with auto-rotation)  
**Deployment:** Render (backend) / Vercel (frontend)

---

## Roles

|     Role      |                            What they do                       |
|---------------|---------------------------------------------------------------|
| **Owner**     | Full control — create users, reset passwords, view everything |
| **Manager**   | Create tasks, assign to team leads, approve completed tasks   |
| **Team Lead** | Accept/reject tasks from manager, assign to developers        |
| **Developer** | Accept/reject assignments, work on tasks, submit for review   |

---

## Task Flow

```
Manager creates task → assigns to Team Lead
    ↓
Team Lead accepts → assigns to Developer
    ↓
Developer accepts → works → submits
    ↓
Manager approves → COMPLETED
```

---

## Getting Started

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your values

# Run database migrations
python manage.py migrate

# Create owner account
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000

---

## API Endpoints

### Auth
|    Method     |         Endpoint            |           Description          |     Access    |
|---------------|-----------------------------|--------------------------------|---------------|
| POST          | /api/v1/auth/register/      | Register user                  | Public        |
| POST          | /api/v1/auth/login/         | Login with optional role check | Public        |
| POST          | /api/v1/auth/logout/        | Logout + blacklist token       | Auth          |
| POST          | /api/v1/auth/token/refresh/ | Get new access token           | Public        |
| GET           | /api/v1/auth/me/            | Current user info              | Auth          |
| GET           | /api/v1/auth/users/         | List users                     | Owner/Manager |
| GET/PUT/PATCH | /api/v1/auth/users/:id/     | User detail/update             | Owner         |
| GET           | /api/v1/auth/teamleads/     | List team leads                | Owner/Manager |
| GET           | /api/v1/auth/developers/    | List developers                | Auth          |

### Tasks
|   Method  |            Endpoint         |                  Description           |        Access     |
|-----------|-----------------------------|----------------------------------------|-------------------|
| GET       | /api/v1/tasks/              | List tasks (role-filtered)             | Auth              |
| POST      | /api/v1/tasks/              | Create task                            | Owner/Manager     |
| GET       | /api/v1/tasks/:id/          | Task detail                            | Auth (own tasks)  |
| PUT/PATCH | /api/v1/tasks/:id/          | Update task                            | Owner/Manager     |
| DELETE    | /api/v1/tasks/:id/          | Delete task                            | Owner/Manager     |
| PATCH     | /api/v1/tasks/:id/status/   | Update status                          | Auth (role-based) |
| POST      | /api/v1/tasks/:id/action/   | Actions (accept/reject/assign/approve) | Auth              |
| GET/POST  | /api/v1/tasks/:id/comments/ | Comments                               | Auth              |

### Dashboard
| Method |        Endpoint          | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | /api/v1/dashboard/       | Role-specific dashboard data   |
| GET    | /api/v1/dashboard/owner/ | Full system stats (Owner only) |

---

## Task Status Flow

```
todo → assigned_to_teamlead → in_progress → assigned_to_developer
     → in_progress → submitted → completed

Any stage → rejected (with reason)
Any stage → blocked
```

---

## Deployment

### Backend on Render
1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn worknext.wsgi`
5. Environment variables: `SECRET_KEY`, `DEBUG=False`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`

### Frontend on Vercel
1. Connect GitHub repo
2. Root directory: `frontend`
3. Framework: Vite
4. Environment variable: `VITE_API_URL`

---

## License

MIT — © 2026 Dushyant Kumar