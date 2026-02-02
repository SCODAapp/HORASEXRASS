import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Referrals from './Referrals';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  onClose: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  const { profile, loading, logout, refreshProfile } = useAuth();
  const [showReferrals, setShowReferrals] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedWhatsApp, setEditedWhatsApp] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setEditedName(profile.full_name);
      setEditedWhatsApp(profile.whatsapp || '');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !editedName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedName.trim(),
          whatsapp: editedWhatsApp.trim() || null
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil. Por favor intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
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
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ marginBottom: '15px' }}>No se pudo cargar el perfil.</p>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Por favor, cierra sesión y vuelve a iniciar sesión.
              </p>
              <button className="btn-signout" onClick={handleSignOut} style={{ marginTop: '20px' }}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

          {isEditing ? (
            <div style={{ width: '100%', marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Tu nombre completo"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                  WhatsApp (con código de país)
                </label>
                <input
                  type="tel"
                  value={editedWhatsApp}
                  onChange={(e) => setEditedWhatsApp(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Recomendado para que puedan contactarte por WhatsApp
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="profile-name">{profile.full_name}</h3>
              <button
                onClick={handleEditClick}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                ✏️ Editar Perfil
              </button>
            </>
          )}

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

          {profile.whatsapp && (
            <div className="profile-info">
              <span className="info-label">WhatsApp:</span>
              <span className="info-value">{profile.whatsapp}</span>
            </div>
          )}

          {profile.negative_ratings_count > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: profile.is_blocked ? '#fef2f2' : '#fef9c3',
              border: `1px solid ${profile.is_blocked ? '#fca5a5' : '#fde047'}`,
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '14px', color: profile.is_blocked ? '#dc2626' : '#ca8a04', fontWeight: '500' }}>
                ⚠️ {profile.negative_ratings_count} calificación{profile.negative_ratings_count > 1 ? 'es' : ''} negativa{profile.negative_ratings_count > 1 ? 's' : ''}
              </div>
              {profile.is_blocked && (
                <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px' }}>
                  Tu cuenta está bloqueada para tomar tareas debido a múltiples reportes
                </div>
              )}
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
