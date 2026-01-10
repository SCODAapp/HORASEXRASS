import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskApplication } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetail({ task, onClose, onUpdate }: TaskDetailProps) {
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const isOwner = user?.id === task.employer_id;
  const isAssigned = user?.id === task.assigned_to;

  useEffect(() => {
    if (isOwner) {
      loadApplications();
    } else {
      checkIfApplied();
    }
  }, [task.id, user]);

  const loadApplications = async () => {
    const { data } = await supabase
      .from('task_applications')
      .select(`
        *,
        worker:profiles!task_applications_worker_id_fkey(*)
      `)
      .eq('task_id', task.id)
      .eq('status', 'pending')
      .order('applied_at', { ascending: true });

    setApplications(data || []);
  };

  const checkIfApplied = async () => {
    const { data } = await supabase
      .from('task_applications')
      .select('id')
      .eq('task_id', task.id)
      .eq('worker_id', user?.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleApply = async () => {
    if (!user || hasApplied) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.id,
          worker_id: user.id,
        });

      if (error) throw error;

      setHasApplied(true);
      alert('¡Postulación enviada con éxito!');
      onUpdate();
    } catch (error: any) {
      alert('Error al postular: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (application: TaskApplication) => {
    setLoading(true);
    try {
      const applicantProfile = application.worker;
      if (!applicantProfile) {
        alert('Error: No se encontró el perfil del trabajador');
        return;
      }

      const competingApps = applications.filter(app =>
        app.worker &&
        app.worker.rating_average === applicantProfile.rating_average &&
        app.worker.rating_count === applicantProfile.rating_count
      );

      let selectedWorker = application.worker_id;

      if (competingApps.length > 1) {
        const sortedApps = competingApps.sort((a, b) => {
          const aCompleted = a.worker?.completed_tasks || 0;
          const bCompleted = b.worker?.completed_tasks || 0;
          return bCompleted - aCompleted;
        });

        selectedWorker = sortedApps[0].worker_id;
      }

      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'assigned',
          assigned_to: selectedWorker,
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      const { error: appError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', applications.find(a => a.worker_id === selectedWorker)?.id);

      if (appError) throw appError;

      const { error: rejectError } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('task_id', task.id)
        .neq('worker_id', selectedWorker);

      if (rejectError) throw rejectError;

      alert('¡Tarea asignada con éxito!');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Error al asignar tarea: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!isOwner || !task.assigned_to) return;

    const confirm = window.confirm('¿Marcar esta tarea como completada?');
    if (!confirm) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .eq('employer_id', user?.id);

      if (error) throw error;

      setShowRating(true);
    } catch (error: any) {
      alert('Error al completar tarea: ' + error.message);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!task.assigned_to) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ratings')
        .insert({
          task_id: task.id,
          worker_id: task.assigned_to,
          employer_id: user?.id,
          stars: rating,
          comment: comment || null,
        });

      if (error) throw error;

      alert('¡Calificación enviada con éxito!');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Error al enviar calificación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async () => {
    const confirm = window.confirm('¿Estás seguro de cancelar esta tarea?');
    if (!confirm) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', task.id);

      if (error) throw error;

      alert('Tarea cancelada');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Error al cancelar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showRating) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Calificar Trabajador</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          <div className="rating-form">
            <div className="form-group">
              <label>Calificación</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? 'star-active' : 'star'}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Comentario (opcional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte tu experiencia..."
                rows={4}
              />
            </div>

            <button
              onClick={handleSubmitRating}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="task-detail">
          <div className="detail-section">
            <h3>Descripción</h3>
            <p>{task.description}</p>
          </div>

          <div className="detail-section">
            <h3>Ubicación</h3>
            <p>📍 {task.location}</p>
            {task.address && <p className="address-detail">{task.address}</p>}
          </div>

          {(task.scheduled_date || task.scheduled_time) && (
            <div className="detail-section">
              <h3>Fecha y Hora</h3>
              <p>
                {task.scheduled_date && `📅 ${new Date(task.scheduled_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                {task.scheduled_time && ` - 🕐 ${task.scheduled_time.slice(0, 5)}`}
              </p>
            </div>
          )}

          <div className="detail-section">
            <h3>Estado</h3>
            <p className="status-text">{task.status === 'pending' ? 'Disponible' : task.status === 'assigned' ? 'Asignada' : task.status === 'completed' ? 'Completada' : 'Cancelada'}</p>
          </div>

          {task.employer && (
            <div className="detail-section">
              <h3>Empleador</h3>
              <div className="profile-info">
                <p>{task.employer.full_name}</p>
                {task.employer.rating_count > 0 && (
                  <p className="rating">⭐ {task.employer.rating_average.toFixed(1)} ({task.employer.rating_count} reseñas)</p>
                )}
              </div>
            </div>
          )}

          {task.worker && (
            <div className="detail-section">
              <h3>Trabajador Asignado</h3>
              <div className="profile-info">
                <p>{task.worker.full_name}</p>
                {task.worker.rating_count > 0 && (
                  <p className="rating">⭐ {task.worker.rating_average.toFixed(1)} ({task.worker.rating_count} reseñas)</p>
                )}
              </div>
            </div>
          )}

          {isOwner && applications.length > 0 && task.status === 'pending' && (
            <div className="detail-section">
              <h3>Postulaciones ({applications.length})</h3>
              <div className="applications-list">
                {applications.map((app) => (
                  <div key={app.id} className="application-card">
                    <div className="application-info">
                      <p className="worker-name">{app.worker?.full_name}</p>
                      {app.worker && app.worker.rating_count > 0 && (
                        <p className="rating">
                          ⭐ {app.worker.rating_average.toFixed(1)} ({app.worker.rating_count} reseñas)
                        </p>
                      )}
                      <p className="completed">✓ {app.worker?.completed_tasks || 0} tareas completadas</p>
                    </div>
                    <button
                      onClick={() => handleAcceptApplication(app)}
                      className="btn-primary btn-small"
                      disabled={loading}
                    >
                      Aceptar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {!isOwner && !isAssigned && task.status === 'pending' && (
              <button
                onClick={handleApply}
                className="btn-primary"
                disabled={loading || hasApplied}
              >
                {hasApplied ? 'Ya postulaste' : loading ? 'Postulando...' : 'Postularme'}
              </button>
            )}

            {isOwner && task.status === 'assigned' && (
              <button
                onClick={handleCompleteTask}
                className="btn-success"
                disabled={loading}
              >
                Marcar como Completada
              </button>
            )}

            {isOwner && task.status === 'pending' && (
              <button
                onClick={handleCancelTask}
                className="btn-danger"
                disabled={loading}
              >
                Cancelar Tarea
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
