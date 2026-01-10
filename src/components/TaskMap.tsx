import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TaskMapProps {
  onSelectTask: (task: Task) => void;
  refreshTrigger: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function TaskMap({ onSelectTask, refreshTrigger }: TaskMapProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([19.4326, -99.1332]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('tasks-map-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_creator_id_fkey(*)
        `)
        .eq('status', 'available')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="loading">Cargando mapa...</div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={userLocation} />

        {tasks.map((task) => {
          if (!task.latitude || !task.longitude) return null;

          return (
            <Marker
              key={task.id}
              position={[task.latitude, task.longitude]}
            >
              <Popup>
                <div className="map-popup">
                  <h3>{task.title}</h3>
                  <p className="popup-description">{task.description}</p>
                  <p className="popup-location">📍 {task.location}</p>
                  {task.scheduled_date && (
                    <p className="popup-date">
                      📅 {new Date(task.scheduled_date).toLocaleDateString('es-ES')}
                      {task.scheduled_time && ` - 🕐 ${task.scheduled_time.slice(0, 5)}`}
                    </p>
                  )}
                  {task.creator && (
                    <p className="popup-employer">
                      👤 {task.creator.full_name}
                      {task.creator.total_ratings > 0 && (
                        <span> ⭐ {task.creator.rating.toFixed(1)}</span>
                      )}
                    </p>
                  )}
                  <button
                    onClick={() => onSelectTask(task)}
                    className="btn-primary btn-small popup-button"
                  >
                    Ver Detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {tasks.length === 0 && (
        <div className="map-empty-state">
          <p>No hay tareas con ubicación disponibles en el mapa</p>
        </div>
      )}
    </div>
  );
}
