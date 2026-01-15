interface ToggleViewProps {
  onToggleView: () => void;
}

export default function ToggleView({ onToggleView }: ToggleViewProps) {
  return (
    <button onClick={onToggleView}>
      Cambiar vista
    </button>
  );
}
