interface ModalProps {
  onClose: () => void;
}

export default function Modal({ onClose }: ModalProps) {
  return (
    <div className="modal">
      <div className="modal-content">
        <p>Contenido del modal</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
