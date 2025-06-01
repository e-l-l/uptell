# Uptell - Real-time Status Monitoring & Incident Management Platform

> Professional status pages and incident management for modern teams. Monitor applications, manage incidents, and keep your users updated in real-time.

## 🚀 Quick Start (Runbook)

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.13+ (for backend)
- **Supabase** account and project
- **Poetry** (Python dependency manager)

### 1. Backend Setup

```bash
cd backend
poetry install
```

Create `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENABLE_EMAIL_NOTIFICATIONS=false  # Set to 'true' to enable email notifications
ENVIRONMENT=development  # or 'production'
FRONTEND_URL=http://localhost:3000  # for CORS in production
```

Run backend:

```bash
poetry run uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

Run frontend:

```bash
npm run dev
```

### 3. Access the Application

- **Frontend**: https://uptell-dibc.vercel.app/
- **Backend API**: https://uptell.onrender.com

## 📋 Features

### ✅ Core Features (Implemented)

#### 🏢 **Multi-Tenant Organizations**

- Organization-based isolation with role-based access
- User invitation system with time-limited invite codes
- Users can belong to multiple organizations

#### 📱 **Application Management**

- **CRUD Operations**: Create, read, update, delete applications
- **Service Types**: Website, Backend, Database
- **Status Management**: Operational, Degraded Performance, Partial Outage, Unknown
- **Status History**: Track status changes over time with timestamps

#### 📊 **Dashboard & Monitoring**

- Real-time status overview of all applications
- Active and upcoming incidents/maintenance display
- Status metrics and uptime calculations
- Organization-specific dashboards

#### 🚨 **Incident Management**

- **Complete Lifecycle**: Create, update, track, and resolve incidents
- **Status Tracking**: Reported → Investigating → Identified → Fixed
- **Incident Logs**: Detailed status updates with message tracking
- **Application Association**: Link incidents to affected applications
- **Pagination**: Efficient handling of large incident lists

#### 🔧 **Maintenance Scheduling**

- Schedule planned maintenance windows
- Set start and end times for maintenance periods
- Automatic status updates during maintenance windows
- User notifications for upcoming maintenance

#### ⚡ **Real-time Updates (WebSockets)**

- Live updates across all connected clients
- Organization-scoped message broadcasting
- Automatic UI refresh on data changes
- Real-time notifications for all CRUD operations

#### 🌐 **Public Status Pages**

- Public endpoints for status page integration
- Organization statistics and incident timelines
- No authentication required for public data
- API endpoints for external status checks

#### 📧 **Email Notifications**

- Configurable email notifications for organization events
- HTML and plain-text email templates
- Organization-wide user notifications
- Environment flag control (`ENABLE_EMAIL_NOTIFICATIONS`)

#### 👥 **User Management**

- User signup and authentication via Supabase Auth
- Organization invitations with unique codes
- User profile management
- Row Level Security (RLS) implementation

### 🔄 **Stretch Goals & Future Features**

- [ ] Advanced filtering and search capabilities
- [ ] Mobile application
- [ ] Integration with monitoring tools (Datadog, New Relic, etc.)

## 🛠 Tech Stack

### **Frontend**

- **Framework**: Next.js 15.3.2 (React 19)
- **Styling**: Tailwind CSS 4.x with custom theme variables
- **UI Components**: Shadcn/ui with Radix UI primitives
- **State Management**: Jotai for atomic state management
- **Data Fetching**: TanStack Query (React Query) v5
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Notifications**: Sonner for toast notifications
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Theme**: next-themes for dark/light mode

### **Backend**

- **Framework**: FastAPI (Python 3.13+)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with JWT tokens
- **WebSockets**: FastAPI WebSocket support
- **Dependencies**: Poetry for package management
- **CORS**: Configurable for development/production
- **Error Handling**: Comprehensive error handling with logging

### **Infrastructure & Database**

- **Database**: PostgreSQL via Supabase
- **Tables**:
  - `orgs` - Organizations
  - `apps` - Applications/Services
  - `incidents` - Incident tracking
  - `incident_logs` - Incident status updates
  - `maintenance` - Maintenance scheduling
  - `user_orgs` - User-Organization relationships
  - `org_invites` - Organization invitations
  - `app_status_history` - Application status change history
- **Row Level Security**: Enabled for multi-tenant data isolation
- **Real-time**: Supabase real-time subscriptions + WebSocket layer

### **Development Tools**

- **TypeScript**: Full type safety across the stack
- **ESLint**: Code linting and formatting
- **Cursor IDE**: AI-powered development environment
- **Git**: Version control with comprehensive .gitignore

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React UI      │    │ • REST API      │    │ • Database      │
│ • Real-time     │    │ • WebSocket     │    │ • Auth          │
│ • State Mgmt    │    │ • Validation    │    │ • Real-time     │
│ • Routing       │    │ • Email Service │    │ • RLS           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        └─────────── WebSocket ──┴───────────────────────┘
                   (Real-time Updates)
```

## 📂 Project Structure

```
uptell/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── (auth)/      # Authentication pages
│   │   │   ├── (protected)/ # Protected application pages
│   │   │   └── (public)/    # Public status pages
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── next.config.ts
│
├── backend/                  # FastAPI backend application
│   ├── routes/              # API route handlers
│   │   ├── apps/           # Application management
│   │   ├── incidents/      # Incident management
│   │   ├── maintenance/    # Maintenance scheduling
│   │   ├── public/         # Public API endpoints
│   │   ├── auth/           # Authentication
│   │   ├── orgs/           # Organization management
│   │   └── user_orgs/      # User-organization relationships
│   ├── utils/              # Utility functions
│   ├── main.py             # FastAPI application entry point
│   ├── websocket_manager.py # WebSocket connection management
│   ├── supabase_client.py  # Supabase client configuration
│   └── pyproject.toml      # Python dependencies
│
└── README.md               # This file
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Organization-scoped data access
- **JWT Authentication**: Secure token-based authentication via Supabase
- **CORS Configuration**: Environment-specific CORS policies
- **Input Validation**: Comprehensive request validation with Pydantic/Zod
- **Error Handling**: Secure error messages without information leakage
- **Service Role Access**: Admin operations use service role keys

## 🚀 Deployment

### Environment Variables

#### Backend

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `ENABLE_EMAIL_NOTIFICATIONS` - Set to `"true"` to enable email notifications (default: `false`)
- `ENVIRONMENT` - `"development"` or `"production"`
- `FRONTEND_URL` - Frontend URL for CORS (production only)

#### Frontend

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

### Production Deployment

1. **Backend**: Deploy to cloud providers like Railway, Render, or AWS
2. **Frontend**: Deploy to Vercel, Netlify, or similar platforms
3. **Database**: Supabase handles hosting and scaling

## 📊 Key Metrics & Features

- **Real-time Performance**: WebSocket-based live updates
- **Multi-tenant**: Organization-scoped data isolation
- **Scalable**: Built with modern, production-ready technologies
- **Type-safe**: Full TypeScript implementation
- **Responsive**: Mobile-first UI design
- **Accessible**: Built with accessibility best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

---

_Built with ❤️ ⚡ by ell._
