import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetail({ task, onClose, onUpdate }: TaskDetailProps) {
  const [loading, setLoading] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showNegativeRating, setShowNegativeRating] = useState(false);
  const [negativeReason, setNegativeReason] = useState('');
  const { user, profile } = useAuth();

  const isCreator = user?.id === task.creator_id;
  const isAssignee = user?.id === task.assigned_to;

  const handleTakeTask = async () => {
    if (!user || !profile) return;

    if (profile.is_blocked) {
      alert('Tu cuenta está bloqueada y no puedes tomar tareas debido a múltiples calificaciones negativas.');
      return;
    }

    const confirm = window.confirm('¿Estás seguro de que quieres tomar esta tarea?');
    if (!confirm) return;

    setLoading(true);
    try {
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('status, assigned_to')
        .eq('id', task.id)
        .single();

      if (fetchError) throw fetchError;

      if (currentTask.status !== 'available' || currentTask.assigned_to) {
        alert('Esta tarea ya no está disponible');
        onUpdate();
        onClose();
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('status', 'available')
        .is('assigned_to', null);

      if (error) {
        if (error.code === '23505' || error.message.includes('conflict')) {
          alert('Alguien más tomó esta tarea primero. Inténtalo con otra tarea.');
        } else {
          throw error;
        }
      } else {
        alert('¡Tarea asignada exitosamente!');
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      console.error('Error taking task:', error);
      alert('Error al tomar la tarea: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!isCreator || !task.assigned_to) return;

    const confirm = window.confirm('¿Marcar esta tarea como completada?');
    if (!confirm) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .eq('creator_id', user?.id);

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
        .from('task_ratings')
        .insert({
          task_id: task.id,
          rated_user_id: task.assigned_to,
          rating_user_id: user?.id,
          rating: rating,
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

  const handleDeleteTask = async () => {
    if (!isCreator) return;

    const confirm = window.confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.');
    if (!confirm) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)
        .eq('creator_id', user?.id);

      if (error) throw error;

      alert('Tarea eliminada exitosamente');
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Error al eliminar tarea: ' + error.message);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNegativeRating = async () => {
    if (!task.assigned_to) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('negative_ratings')
        .insert({
          creator_id: user?.id,
          worker_id: task.assigned_to,
          task_id: task.id,
          reason: negativeReason || null,
        });

      if (error) {
        if (error.code === '23505') {
          alert('Ya has calificado negativamente a este usuario por esta tarea.');
        } else {
          throw error;
        }
      } else {
        alert('Calificación negativa registrada. El usuario ha sido notificado.');
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      alert('Error al enviar calificación negativa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  if (showNegativeRating) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Reportar Usuario</h2>
            <button className="modal-close" onClick={() => setShowNegativeRating(false)}>×</button>
          </div>

          <div className="task-detail">
            <div style={{ padding: '20px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>
                ⚠️ Advertencia
              </p>
              <p style={{ fontSize: '13px', color: '#7f1d1d' }}>
                Esta acción registrará una calificación negativa para el usuario. Después de 3 calificaciones negativas,
                su cuenta será bloqueada y no podrá tomar más tareas.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="negativeReason">Motivo del reporte</label>
              <textarea
                id="negativeReason"
                value={negativeReason}
                onChange={(e) => setNegativeReason(e.target.value)}
                placeholder="Ej: El usuario aceptó la tarea pero no se presentó"
                rows={4}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSubmitNegativeRating}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Enviando...' : 'Confirmar Reporte'}
              </button>
              <button
                onClick={() => setShowNegativeRating(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showRating) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Calificar Usuario</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="task-detail">
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
                className="btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Calificación'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    const statuses: Record<string, string> = {
      available: 'Disponible',
      assigned: 'Asignada',
      in_progress: 'En progreso',
      completed: 'Completada',
      rated: 'Calificada',
    };
    return statuses[status] || status;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{task.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
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
            <p className="status-text">{getStatusText(task.status)}</p>
          </div>

          {task.creator && (
            <div className="detail-section">
              <h3>Publicado por</h3>
              <div className="profile-info">
                <p>{task.creator.full_name}</p>
                {task.creator.total_ratings > 0 && (
                  <p className="rating">⭐ {task.creator.rating.toFixed(1)} ({task.creator.total_ratings} {task.creator.total_ratings === 1 ? 'calificación' : 'calificaciones'})</p>
                )}
                <p className="completed">✓ {task.creator.published_tasks} {task.creator.published_tasks === 1 ? 'tarea publicada' : 'tareas publicadas'}</p>
                {isAssignee && task.creator?.whatsapp && (
                  <button
                    onClick={() => task.creator && openWhatsApp(task.creator.whatsapp!)}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    💬 Contactar por WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}

          {task.assignee && (
            <div className="detail-section">
              <h3>Asignado a</h3>
              <div className="profile-info">
                <p>{task.assignee.full_name}</p>
                {task.assignee.total_ratings > 0 && (
                  <p className="rating">⭐ {task.assignee.rating.toFixed(1)} ({task.assignee.total_ratings} {task.assignee.total_ratings === 1 ? 'calificación' : 'calificaciones'})</p>
                )}
                <p className="completed">✓ {task.assignee.completed_tasks} {task.assignee.completed_tasks === 1 ? 'tarea completada' : 'tareas completadas'}</p>
                {isCreator && task.assignee?.whatsapp && (
                  <button
                    onClick={() => task.assignee && openWhatsApp(task.assignee.whatsapp!)}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#25D366',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    💬 Contactar por WhatsApp
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            {!isCreator && !isAssignee && task.status === 'available' && (
              <button
                onClick={handleTakeTask}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Tomando tarea...' : 'Tomar Esta Tarea'}
              </button>
            )}

            {isCreator && task.status === 'assigned' && (
              <>
                <button
                  onClick={handleCompleteTask}
                  className="btn-success"
                  disabled={loading}
                >
                  Marcar como Completada
                </button>
                <button
                  onClick={() => setShowNegativeRating(true)}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '16px'
                  }}
                >
                  ⚠️ Reportar No Presentación
                </button>
              </>
            )}

            {(task.status === 'completed' || task.status === 'rated') && isCreator && (
              <div className="success-message">
                <p>Esta tarea ha sido completada</p>
              </div>
            )}

            {isCreator && (
              <button
                onClick={handleDeleteTask}
                className="btn-danger"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar Tarea'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
