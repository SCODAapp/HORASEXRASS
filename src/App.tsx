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
          <img src="/logoextrass.png" alt="Hextras" className="app-logo" />
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
