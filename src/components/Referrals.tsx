import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Referral } from '../lib/supabase';

interface ReferralsProps {
  onClose: () => void;
}

export default function Referrals({ onClose }: ReferralsProps) {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReferrals(data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralCode = () => {
    const text = `¡Únete a Horas Extras con mi código ${profile?.referral_code} y obtén 50% de descuento en tu suscripción! 🎉`;
    const url = `${window.location.origin}/?ref=${profile?.referral_code}`;

    if (navigator.share) {
      navigator.share({
        title: 'Únete a Horas Extras',
        text: text,
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!profile) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content referral-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">Invita y Gana</h2>

        <div className="referral-benefits">
          <div className="benefit-card">
            <span className="benefit-icon">🎁</span>
            <h3>50% de Descuento</h3>
            <p>Tú y tu amigo obtienen 50% OFF cuando se registre con tu código</p>
          </div>
        </div>

        <div className="referral-code-section">
          <label>Tu Código de Referido</label>
          <div className="referral-code-box">
            <span className="referral-code">{profile.referral_code || 'Cargando...'}</span>
            <button
              className="btn-copy"
              onClick={copyReferralCode}
              disabled={!profile.referral_code}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          <button
            className="btn-share"
            onClick={shareReferralCode}
            disabled={!profile.referral_code}
          >
            📱 Compartir con Amigos
          </button>
        </div>

        <div className="referral-stats">
          <div className="stat-item">
            <span className="stat-number">{profile.successful_referrals || 0}</span>
            <span className="stat-label">Referidos Exitosos</span>
          </div>

          {profile.has_referral_discount && (
            <div className="stat-item highlight">
              <span className="stat-number">50%</span>
              <span className="stat-label">Descuento Activo</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : myReferrals.length > 0 ? (
          <div className="referrals-list">
            <h3>Personas que Referiste</h3>
            <div className="referrals-count">
              {myReferrals.length} {myReferrals.length === 1 ? 'persona' : 'personas'}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Aún no has referido a nadie.</p>
            <p>¡Comparte tu código y ambos obtendrán 50% de descuento!</p>
          </div>
        )}

        <div className="referral-note">
          <p><strong>¿Cómo funciona?</strong></p>
          <ol>
            <li>Comparte tu código con amigos</li>
            <li>Ellos se registran usando tu código</li>
            <li>¡Ambos obtienen 50% de descuento cuando lancemos la suscripción!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
