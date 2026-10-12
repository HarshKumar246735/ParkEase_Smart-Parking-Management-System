import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Keep it', danger = false, busy = false, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      locked={busy}
      footer={
        <>
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}
