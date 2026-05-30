export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <header>
          <h2>{title}</h2>
          <button onClick={onClose}>×</button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  )
}
