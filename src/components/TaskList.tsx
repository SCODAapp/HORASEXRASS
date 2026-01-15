import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TaskListProps {
  onSelectTask: (task: Task) => void;
  onCreateTask: () => void;
}

export default function TaskList({ onSelectTask, onCreateTask }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'assigned'>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, user]);

  const loadTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          creator:profiles!tasks_creator_id_fkey(*),
          assignee:profiles!tasks_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'published') {
        query = query.eq('creator_id', user?.id);
      } else if (filter === 'assigned') {
        query = query.eq('assigned_to', user?.id);
      } else {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, rating?: number) => {
    const badges = {
      available: { text: 'Disponible', class: 'badge-available' },
      assigned: { text: 'Asignada', class: 'badge-assigned' },
      in_progress: { text: 'En progreso', class: 'badge-in_progress' },
      completed: { text: 'Completada', class: 'badge-completed' },
      rated: {
        text: rating ? `Calificada: ${rating} ${'⭐'.repeat(rating)}` : 'Calificada',
        class: 'badge-rated',
      },
    };
    return badges[status as keyof typeof badges] || badges.available;
  };

  if (loading) {
    return <div className="loading">Cargando tareas...</div>;
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>Tareas</h2>
        <button onClick={onCreateTask} className="btn-primary btn-create">
          + Nueva Tarea
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('all')}
        >
          Disponibles
        </button>
        <button
          className={filter === 'published' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('published')}
        >
          Mis Publicadas
        </button>
        <button
          className={filter === 'assigned' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('assigned')}
        >
          Mis Asignadas
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>No hay tareas disponibles</p>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="task-card"
              onClick={() => onSelectTask(task)}
            >
              <div className="task-card-header">
                <h3>{task.title}</h3>
                <span
                  className={`badge ${getStatusBadge(task.status, task.rating)?.class}`}
                >
                  {getStatusBadge(task.status, task.rating)?.text}
                </span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-meta">
                <span className="location">📍 {task.location}</span>
                {(task.scheduled_date || task.scheduled_time) && (
                  <span className="task-datetime">
                    {task.scheduled_date &&
                      `📅 ${new Date(task.scheduled_date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}`}
                    {task.scheduled_time && ` 🕐 ${task.scheduled_time.slice(0, 5)}`}
                  </span>
                )}
                {task.creator && (
                  <span className="employer">
                    👤 {task.creator.full_name}
                    {task.creator.total_ratings > 0 && (
                      <span className="rating">
                        ⭐ {task.creator.rating.toFixed(1)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

    </div>
  );
}
