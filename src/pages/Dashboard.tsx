import { useAuth } from '../contexts/AuthContext';
import EmployeeDashboard from '../components/EmployeeDashboard';
import EmployerDashboard from '../components/EmployerDashboard';

export default function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">No se pudo cargar el perfil</p>
          <p className="text-gray-600 mt-2">Por favor, intenta cerrar sesión y volver a iniciar sesión</p>
        </div>
      </div>
    );
  }

  return profile.role === 'employer' ? <EmployerDashboard /> : <EmployeeDashboard />;
}
