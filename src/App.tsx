import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Modal from './components/Modal';
import ToggleView from './components/ToggleView';

export default function App() {
  const [showLogin] = useState(true); // ← eliminamos setShowLogin
  const [showModal, setShowModal] = useState(false);
  // const [isGridView, setIsGridView] = useState(true); ← eliminada porque no se usa

  const handleCloseModal = () => setShowModal(false);
  const handleToggleView = () => {}; // temporal si no usas vista grid/list

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
