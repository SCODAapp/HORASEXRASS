import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, OvertimeWithProfile } from '../lib/supabase';
import { Clock, LogOut, CheckCircle, XCircle, MapPin, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MapView from './MapView';

export default function EmployerDashboard() {
  const { profile, signOut } = useAuth();
  const [requests, setRequests] = useState<OvertimeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<OvertimeWithProfile | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime_requests')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('overtime_requests')
        .update({
          status: 'approved',
          approved_by: profile?.id
        })
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('overtime_requests')
        .update({
          status: 'rejected',
          approved_by: profile?.id
        })
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedHours = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.hours), 0);
  const uniqueEmployees = new Set(requests.map((r) => r.employee_id)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Panel de Empleador</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile?.full_name}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 transition"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Aprobadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{approvedHours.toFixed(1)}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Empleados</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{uniqueEmployees}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Horas Extras</h2>
            <div className="flex space-x-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Todas' : status === 'pending' ? 'Pendientes' : status === 'approved' ? 'Aprobadas' : 'Rechazadas'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay solicitudes para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {request.profiles.full_name}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                          {request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(request.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {request.hours} horas
                        </span>
                        {request.location_name && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {request.location_name}
                          </span>
                        )}
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                    {(request.latitude && request.longitude) && (
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="ml-4 text-blue-600 hover:text-blue-700 transition"
                      >
                        <MapPin className="h-6 w-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <MapView
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
