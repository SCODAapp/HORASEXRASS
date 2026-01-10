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
  const [filter, setFilter] = useState<'all' | 'my-tasks' | 'my-applications'>('all');
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
          employer:profiles!tasks_employer_id_fkey(*),
          worker:profiles!tasks_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'my-tasks') {
        query = query.eq('employer_id', user?.id);
      } else if (filter === 'my-applications') {
        const { data: applications } = await supabase
          .from('task_applications')
          .select('task_id')
          .eq('worker_id', user?.id);

        const taskIds = applications?.map(app => app.task_id) || [];
        if (taskIds.length > 0) {
          query = query.in('id', taskIds);
        } else {
          setTasks([]);
          setLoading(false);
          return;
        }
      } else {
        query = query.eq('status', 'pending');
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: 'Disponible', class: 'badge-pending' },
      assigned: { text: 'Asignada', class: 'badge-assigned' },
      completed: { text: 'Completada', class: 'badge-completed' },
      cancelled: { text: 'Cancelada', class: 'badge-cancelled' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
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
          Todas
        </button>
        <button
          className={filter === 'my-tasks' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('my-tasks')}
        >
          Mis Tareas
        </button>
        <button
          className={filter === 'my-applications' ? 'tab-active' : 'tab'}
          onClick={() => setFilter('my-applications')}
        >
          Postulaciones
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
                <span className={`badge ${getStatusBadge(task.status).class}`}>
                  {getStatusBadge(task.status).text}
                </span>
              </div>
              <p className="task-description">{task.description}</p>
              <div className="task-meta">
                <span className="location">📍 {task.location}</span>
                {(task.scheduled_date || task.scheduled_time) && (
                  <span className="task-datetime">
                    {task.scheduled_date && `📅 ${new Date(task.scheduled_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                    {task.scheduled_time && ` 🕐 ${task.scheduled_time.slice(0, 5)}`}
                  </span>
                )}
                {task.employer && (
                  <span className="employer">
                    👤 {task.employer.full_name}
                    {task.employer.rating_count > 0 && (
                      <span className="rating">
                        ⭐ {task.employer.rating_average.toFixed(1)}
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
