import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, MapPin, Loader } from 'lucide-react';

interface OvertimeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function OvertimeForm({ onClose, onSuccess }: OvertimeFormProps) {
  const { profile } = useAuth();
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('No se pudo obtener la ubicación');
          setGettingLocation(false);
        }
      );
    } else {
      setError('Geolocalización no disponible');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('overtime_requests')
        .insert({
          employee_id: profile?.id,
          date,
          hours: parseFloat(hours),
          description,
          location_name: locationName || null,
          latitude,
          longitude
        });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al crear la solicitud');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Horas Extras</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
              Horas
            </label>
            <input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="8"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del Trabajo
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Describe el trabajo realizado..."
            />
          </div>

          <div>
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              id="locationName"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Nombre del lugar"
            />
          </div>

          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          >
            {gettingLocation ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2" />
                {latitude && longitude ? 'Ubicación guardada' : 'Obtener ubicación actual'}
              </>
            )}
          </button>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
