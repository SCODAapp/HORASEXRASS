import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateTaskProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTask({ onClose, onSuccess }: CreateTaskProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        setError('No se pudo obtener tu ubicación: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          employer_id: user?.id,
          title,
          description,
          location,
          address: address || null,
          latitude,
          longitude,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          status: 'pending',
        });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Nueva Tarea</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Título de la Tarea *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: Ayuda con mudanza"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe detalladamente la tarea..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduledDate">Fecha</label>
              <input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="scheduledTime">Hora</label>
              <input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Ciudad/Zona *</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="Ej: Polanco, CDMX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección Completa</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Calle Masaryk 123, Polanco"
            />
          </div>

          <div className="form-group">
            <label>Ubicación en el Mapa</label>
            <div className="location-controls">
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn-secondary"
                disabled={gettingLocation}
              >
                {gettingLocation ? 'Obteniendo ubicación...' : latitude ? '✓ Ubicación Obtenida' : '📍 Obtener Mi Ubicación'}
              </button>
              {latitude && longitude && (
                <span className="location-coords">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              )}
            </div>
            <small>Opcional: Permite que los trabajadores vean tu tarea en el mapa</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
