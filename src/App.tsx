import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import TaskMap from './components/TaskMap';
import TaskDetail from './components/TaskDetail';
import CreateTask from './components/CreateTask';
import Profile from './components/Profile';
import type { Task } from './lib/supabase';
import './App.css';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return showLogin ? (
      <Login onToggleView={() => setShowLogin(false)} />
    ) : (
      <Register onToggleView={() => setShowLogin(true)} />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title-container">
          <svg className="app-logo" viewBox="0 0 463 152" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="463" height="152" rx="20" fill="#00A8E8"/>
            <circle cx="91" cy="76" r="60" fill="white"/>
            <path d="M91 45 C85 45 80 50 80 56 L90 56 C90 54 90.5 53 91 53 C92 53 93 53.5 93 55 C93 57 91 58 87 60 C82 62 78 65 78 72 L78 75 L104 75 L104 68 L88 68 C88.5 66.5 89.5 66 91 65 C96 63 103 61 103 54 C103 48.5 98 45 91 45 Z M78 82 L78 97 L90 97 L90 89 L104 89 L104 82 Z" fill="#00A8E8"/>
            <line x1="176" y1="20" x2="176" y2="132" stroke="white" strokeWidth="4"/>
            <text x="204" y="62" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">HORAS</text>
            <text x="204" y="118" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">EXTRAS</text>
          </svg>
          <h1 className="app-title">Hextras</h1>
        </div>
        <button
          className="profile-button"
          onClick={() => setShowProfile(true)}
          title="Mi perfil"
        >
          <span className="profile-icon">👤</span>
          <span className="profile-name">{profile?.full_name}</span>
          {profile && profile.total_ratings > 0 && (
            <span className="header-rating">⭐ {profile.rating.toFixed(1)}</span>
          )}
        </button>
      </header>

      <div className="view-toggle">
        <button
          className={viewMode === 'list' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setViewMode('list')}
        >
          📋 Lista
        </button>
        <button
          className={viewMode === 'map' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setViewMode('map')}
        >
          🗺️ Mapa
        </button>
        <button
          className="toggle-btn btn-create-main"
          onClick={() => setShowCreateTask(true)}
        >
          + Nueva Tarea
        </button>
      </div>

      <main className="app-main">
        {viewMode === 'list' ? (
          <TaskList
            key={refreshTrigger}
            onSelectTask={setSelectedTask}
            onCreateTask={() => setShowCreateTask(true)}
          />
        ) : (
          <TaskMap
            onSelectTask={setSelectedTask}
            refreshTrigger={refreshTrigger}
          />
        )}
      </main>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleRefresh}
        />
      )}

      {showCreateTask && (
        <CreateTask
          onClose={() => setShowCreateTask(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showProfile && (
        <Profile onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
