interface ToggleViewProps {
  viewMode: 'list' | 'map';
  onToggleView: (mode: 'list' | 'map') => void;
  onCreateTask: () => void;
}

export default function ToggleView({ viewMode, onToggleView, onCreateTask }: ToggleViewProps) {
  return (
    <div className="view-toggle">
      <button
        className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onToggleView('list')}
      >
        📋 Lista
      </button>
      <button
        className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
        onClick={() => onToggleView('map')}
      >
        🗺️ Mapa
      </button>
      <button
        className="toggle-btn btn-create-main"
        onClick={onCreateTask}
      >
        ➕ Crear Tarea
      </button>
    </div>
  );
}
