import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, OvertimeRequest } from '../lib/supabase';
import { Clock, LogOut, Plus, MapPin, Calendar, CheckCircle, XCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import OvertimeForm from './OvertimeForm';
import MapView from './MapView';

export default function EmployeeDashboard() {
  const { profile, signOut } = useAuth();
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('overtime_requests')
        .select('*')
        .eq('employee_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Loader className="h-5 w-5" />;
    }
  };

  const totalHours = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.hours), 0);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Panel de Empleado</h1>
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
                <p className="text-sm text-gray-600">Total Horas Aprobadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount}</p>
              </div>
              <Loader className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Solicitudes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{requests.length}</p>
              </div>
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Solicitud
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes solicitudes de horas extras</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-2 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(request.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium mb-1">{request.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <OvertimeForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadRequests();
          }}
        />
      )}

      {selectedRequest && (
        <MapView
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
