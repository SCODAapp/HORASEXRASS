import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RegisterProps {
  onToggleView: () => void;
}

export default function Register({ onToggleView }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, []);

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
      const { user } = await signUp(email, password, fullName);

      if (user && referralCode.trim()) {
        const { error: refError } = await supabase.rpc('apply_referral_code', {
          p_user_id: user.id,
          p_referral_code: referralCode.trim().toUpperCase()
        });

        if (refError) {
          console.warn('Error al aplicar código de referido:', refError);
        }
      }
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
        <svg className="auth-logo" viewBox="0 0 463 152" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '280px', height: 'auto', margin: '0 auto 1rem', pointerEvents: 'none' }}>
          <rect width="463" height="152" rx="20" fill="#00A8E8"/>
          <circle cx="91" cy="76" r="60" fill="white"/>
          <text x="91" y="106" fill="#00A8E8" fontSize="80" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle">$</text>
          <line x1="176" y1="20" x2="176" y2="132" stroke="white" strokeWidth="4"/>
          <text x="204" y="62" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">HORAS</text>
          <text x="204" y="118" fill="white" fontSize="42" fontWeight="bold" fontFamily="Arial, sans-serif">EXTRAS</text>
        </svg>
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

          <div className="form-group">
            <label htmlFor="referralCode" className="form-label">
              Código de Referido (Opcional)
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="form-input"
              placeholder="JUAN2024"
              maxLength={20}
            />
            {referralCode && (
              <p className="form-hint referral-hint">🎁 Obtendrás 50% de descuento</p>
            )}
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
