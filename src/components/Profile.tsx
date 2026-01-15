import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    alert('Has cerrado sesión');
  };

  if (!user) return <p>Cargando usuario...</p>;

  return (
    <div className="profile-page">
      <h2>Bienvenido, {profile?.full_name || user.email}</h2>
      <p>Email: {user.email}</p>
      {profile && (
        <p>
          Completó {profile.completed_tasks} tareas,  
          Calificación promedio: {profile.rating?.toFixed(1) || 0} ⭐
        </p>
      )}
      <button onClick={handleLogout}>Cerrar sesión</button>
    </div>
  );
}
