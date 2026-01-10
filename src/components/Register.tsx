import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onToggleView: () => void;
}

export default function Register({ onToggleView }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Hextras</h1>
        <p className="auth-subtitle">Marketplace de tareas</p>

        <h2 className="auth-heading">Crear Cuenta</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Nombre Completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="form-input"
              placeholder="Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
              minLength={6}
            />
            <p className="form-hint">Mínimo 6 caracteres</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="auth-toggle">
          ¿Ya tienes una cuenta?{' '}
          <button onClick={onToggleView} className="link-button">
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}
