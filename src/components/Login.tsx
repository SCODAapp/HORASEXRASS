import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onToggleView: () => void;
}

export default function Login({ onToggleView }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <svg className="auth-logo" viewBox="0 0 463 152" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '280px', height: 'auto', margin: '0 auto 1rem', pointerEvents: 'none' }}>
          <rect width="463" height="152" rx="20" fill="#00A8E8"/>
          <circle cx="91" cy="76" r="60" fill="white"/>
          <text x="91" y="106" fill="#00A8E8" fontSize="80" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">$</text>
          <line x1="176" y1="20" x2="176" y2="132" stroke="white" strokeWidth="4"/>
          <text x="204" y="62" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">HORAS</text>
          <text x="204" y="118" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">EXTRAS</text>
        </svg>
        <p className="auth-subtitle">Marketplace de tareas</p>

        <h2 className="auth-heading">Iniciar Sesión</h2>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-toggle">
          ¿No tienes una cuenta?{' '}
          <button onClick={onToggleView} className="link-button">
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
