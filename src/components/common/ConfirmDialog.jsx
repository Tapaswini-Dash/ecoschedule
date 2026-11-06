import Modal from './Modal'

export default function ConfirmDialog({
  open, title = 'Are you sure?', message, confirmLabel = 'Confirm',
  danger = false, busy = false, onConfirm, onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? undefined : onCancel}
      width="max-w-sm"
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm text-text hover:bg-panel-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              danger ? 'bg-bad hover:opacity-90' : 'bg-forest hover:opacity-90'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  )
}