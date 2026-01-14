import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Referrals from './Referrals';

interface ProfileProps {
  onClose: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  const { profile, signOut } = useAuth();
  const [showReferrals, setShowReferrals] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Mi Perfil</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-content">
          <div className="profile-avatar">
            <span className="avatar-icon">👤</span>
          </div>

          <h3 className="profile-name">{profile.full_name}</h3>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">
                {profile.total_ratings > 0 ? (
                  <>
                    <span className="rating-stars">⭐</span>
                    {profile.rating.toFixed(2)}
                  </>
                ) : (
                  <span className="no-rating">Sin calificación</span>
                )}
              </div>
              <div className="stat-label">
                {profile.total_ratings > 0
                  ? `${profile.total_ratings} ${profile.total_ratings === 1 ? 'calificación' : 'calificaciones'}`
                  : 'Completa tareas para recibir calificaciones'}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{profile.completed_tasks}</div>
              <div className="stat-label">Tareas completadas</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{profile.published_tasks}</div>
              <div className="stat-label">Tareas publicadas</div>
            </div>
          </div>

          {profile.phone && (
            <div className="profile-info">
              <span className="info-label">Teléfono:</span>
              <span className="info-value">{profile.phone}</span>
            </div>
          )}

          <div className="referral-preview">
            <div className="referral-preview-content">
              <span className="referral-icon">🎁</span>
              <div className="referral-info">
                <strong>Invita Amigos</strong>
                <p>{profile.successful_referrals || 0} referidos · 50% OFF para ambos</p>
              </div>
            </div>
            <button className="btn-referral" onClick={() => setShowReferrals(true)}>
              Ver Código
            </button>
          </div>

          <button className="btn-signout" onClick={handleSignOut}>
            Cerrar Sesión
          </button>
        </div>

        {showReferrals && (
          <Referrals onClose={() => setShowReferrals(false)} />
        )}
      </div>
    </div>
  );
}
