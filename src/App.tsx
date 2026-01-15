import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Modal from './components/Modal';
import ToggleView from './components/ToggleView';

export default function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  const handleCloseModal = () => setShowModal(false);
  const handleToggleView = () => setIsGridView((prev) => !prev);

  return (
    <AuthProvider>
      <div className="app-container">
        <header>
          <h1>Mi App</h1>
          <button onClick={() => setShowModal(true)}>Abrir Modal</button>
          <ToggleView onToggleView={handleToggleView} />
        </header>

        <main>
          {showLogin ? <Login /> : <Register />}
          <Profile />
        </main>

        {showModal && <Modal onClose={handleCloseModal} />}
      </div>
    </AuthProvider>
  );
}
