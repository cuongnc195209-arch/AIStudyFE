import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../../apis/documentApi";
import "./DocumentsPage.css";

const SUBJECTS = ['Tất cả', 'Toán', 'Lý', 'Hóa', 'Văn', 'Anh', 'CNTT', 'Kinh tế', 'Khác']
const FILE_TYPES = ['Tất cả', 'PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT', 'PNG', 'JPG']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name', label: 'Tên A-Z' },
  { value: 'size', label: 'Kích thước' },
]
const EXT_COLOR = {
  PDF: '#e53e3e',
  DOCX: '#3182ce',
  PPTX: '#dd6b20',
  XLSX: '#38a169',
  TXT: '#718096',
  PNG: '#805ad5',
  JPG: '#d53f8c',
}

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
}

function mapApiDoc(d) {
  const rawSize = d.fileSize || 0
  return {
    id: d.documentId || d.id,
    name: d.documentName || d.name || "Untitled Document",
    ext: (d.fileType || d.ext || "PDF").toUpperCase(),
    subject: d.subject || "Tài liệu",
    sizeMB: rawSize ? Number((rawSize / 1024 / 1024).toFixed(1)) : 0,
    fileSize: rawSize,
    date: d.createdAt
      ? d.createdAt.slice(0, 10)
      : d.date || new Date().toISOString().slice(0, 10),
    tags: d.tags || [],
    privacy: d.privacy || "private",
    downloads: d.downloads || 0,
    previewUrl: d.previewUrl || '',
    downloadUrl: d.downloadUrl || '',
  }
}

/* ── Helpers ── */
function sizeLabel(mb) {
  return mb >= 1 ? `${mb} MB` : `${(mb * 1024).toFixed(0)} KB`
}

function relativeDate(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  if (diff < 7) return `${diff} ngày trước`;
  if (diff < 30) return `${Math.floor(diff / 7)} tuần trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function sortDocs(docs, sort) {
  return [...docs].sort((a, b) => {
    if (sort === 'newest') return new Date(b.date) - new Date(a.date)
    if (sort === 'oldest') return new Date(a.date) - new Date(b.date)
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'size') return b.sizeMB - a.sizeMB
    return 0
  })
}

/* ── Upload Modal ── */
function UploadModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("drop");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState({
    name: "",
    subject: SUBJECTS[1],
    description: "",
    tags: "",
    privacy: "private",
  });

  const inputRef = useRef();

  function handleFilePick(f) {
    if (!f) return
    const ext = ALLOWED_TYPES[f.type]
    if (!ext) { setError('Định dạng không hỗ trợ. Chỉ chấp nhận PDF, DOCX, PPTX, JPG, PNG.'); return }
    if (f.size > 50 * 1024 * 1024) { setError('File vượt quá 50 MB.'); return }
    setError('')
    setFile({ raw: f, ext, sizeMB: (f.size / 1048576).toFixed(1) })
    setMeta(m => ({ ...m, name: f.name.replace(/\.[^.]+$/, '') }))
    setStep('form')
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFilePick(e.dataTransfer.files[0])
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!meta.name.trim() || !file) return;

    setStep("uploading");

    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 6;

      if (p >= 100) {
        clearInterval(iv);
        setProgress(100);
        setStep("done");

        setTimeout(() => {
          onSuccess({
            name: meta.name.trim(),
            ext: file.ext,
            subject: meta.subject,
            sizeMB: file.sizeMB,
            fileSize: file.raw.size,
            date: new Date().toISOString().slice(0, 10),
            tags: meta.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            privacy: meta.privacy,
            downloads: 0,
            previewUrl: "",
            downloadUrl: "",
          });
        }, 600);
      } else {
        setProgress(Math.min(p, 95));
      }
    }, 180);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{step === 'done' ? 'Upload thành công!' : 'Upload Tài liệu'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Step: drop zone */}
        {step === 'drop' && (
          <div className="modal-body">
            <div
              className={`drop-zone${dragOver ? ' drop-zone--over' : ''}`}
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="drop-icon">📂</div>
              <p className="drop-title">Kéo thả file vào đây</p>
              <p className="drop-sub">hoặc <span className="drop-link">chọn từ máy tính</span></p>
              <p className="drop-hint">PDF, DOCX, PPTX, JPG, PNG · Tối đa 50 MB</p>
              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFilePick(e.target.files[0])} />
            </div>
            {error && <p className="upload-error">⚠️ {error}</p>}
          </div>
        )}

        {/* Step: metadata form */}
        {step === 'form' && (
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="selected-file">
              <div
                className="doc-ext"
                style={{ background: EXT_COLOR[file.ext] }}
              >
                {file.ext}
              </div>

              <div>
                <p className="sf-name">{file.raw.name}</p>
                <p className="sf-size">{file.sizeMB} MB</p>
              </div>
              <button type="button" className="sf-change" onClick={() => setStep('drop')}>Đổi file</button>
            </div>

            <div className="form-grid">
              <div className="fg-full">
                <label>Tên tài liệu <span className="required">*</span></label>
                <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} placeholder="Nhập tên tài liệu" required />
              </div>
              <div>
                <label>Môn học <span className="required">*</span></label>
                <select value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}>
                  {SUBJECTS.slice(1).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label>Quyền riêng tư</label>
                <select value={meta.privacy} onChange={e => setMeta(m => ({ ...m, privacy: e.target.value }))}>
                  <option value="private">🔒 Riêng tư</option>
                  <option value="public">🌐 Công khai</option>
                </select>
              </div>
              <div className="fg-full">
                <label>Tag (cách bằng dấu phẩy)</label>
                <input value={meta.tags} onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))} placeholder="ví dụ: lý thuyết, ôn tập, chương 1" />
              </div>
              <div className="fg-full">
                <label>Mô tả</label>
                <textarea value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} placeholder="Mô tả ngắn về tài liệu..." rows={3} />
              </div>
            </div>

            {error && <p className="upload-error">⚠️ {error}</p>}

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
              <button type="submit" className="btn-primary">⬆️ Xác nhận Upload</button>
            </div>
          </form>
        )}

        {/* Step: uploading */}
        {step === 'uploading' && (
          <div className="modal-body upload-progress-wrap">
            <div className="upload-progress-icon">📤</div>
            <p className="up-title">Đang upload tài liệu...</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="up-percent">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="modal-body upload-done-wrap">
            <div className="done-icon">✅</div>
            <p className="done-title">Upload thành công!</p>
            <p className="done-sub">Tài liệu đã được lưu và đang được AI xử lý để hỗ trợ chatbot.</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Edit Modal ── */
function EditModal({ doc, onClose, onSave }) {
  const [meta, setMeta] = useState({ name: doc.name, subject: doc.subject, tags: doc.tags.join(', '), privacy: doc.privacy })

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...doc, name: meta.name.trim(), subject: meta.subject, tags: meta.tags.split(',').map(t => t.trim()).filter(Boolean), privacy: meta.privacy })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Chỉnh sửa tài liệu</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="fg-full">
              <label>Tên tài liệu <span className="required">*</span></label>
              <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} required />
            </div>
            <div>
              <label>Môn học</label>
              <select value={meta.subject} onChange={e => setMeta(m => ({ ...m, subject: e.target.value }))}>
                {SUBJECTS.slice(1).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label>Quyền riêng tư</label>
              <select value={meta.privacy} onChange={e => setMeta(m => ({ ...m, privacy: e.target.value }))}>
                <option value="private">🔒 Riêng tư</option>
                <option value="public">🌐 Công khai</option>
              </select>
            </div>
            <div className="fg-full">
              <label>Tag</label>
              <input value={meta.tags} onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))} placeholder="tag1, tag2, tag3" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary">💾 Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Delete Confirm ── */
function DeleteConfirm({ doc, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--sm">
        <div className="modal-header">
          <h2>Xóa tài liệu</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="delete-confirm-icon">🗑️</div>
          <p className="delete-confirm-text">Bạn có chắc muốn xóa tài liệu <strong>"{doc.name}"</strong>?</p>
          <p className="delete-confirm-sub">Tài liệu sẽ bị xóa vĩnh viễn khỏi Cloud Storage và không thể khôi phục.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-danger" onClick={() => onConfirm(doc.id)}>Xóa tài liệu</button>
        </div>
      </div>
    </div>
  )
}

/* ── Document Card (Grid view) ── */
function DocCard({ doc, onEdit, onDelete }) {
  return (
    <div className="doc-card">
      <div className="doc-card-top">
        <div className="doc-card-ext" style={{ background: EXT_COLOR[doc.ext] }}>{doc.ext}</div>
        <div className="doc-card-privacy">
          {doc.privacy === 'public' ? <span className="badge-public">🌐 Công khai</span> : <span className="badge-private">🔒 Riêng tư</span>}
        </div>
      </div>
      <p className="doc-card-name">{doc.name}</p>
      <p className="doc-card-subject">{doc.subject}</p>
      <div className="doc-card-tags">
        {doc.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
        {doc.tags.length > 2 && <span className="tag tag--more">+{doc.tags.length - 2}</span>}
      </div>
      <div className="doc-card-footer">
        <span className="doc-card-meta">{sizeLabel(doc.sizeMB)} · {relativeDate(doc.date)}</span>
        {doc.downloads > 0 && <span className="doc-card-dl">⬇️ {doc.downloads}</span>}
      </div>
      <div className="doc-card-actions">
        <button className="card-action-btn" title="Xem trước">
          👁️ Xem
        </button>

        <button className="card-action-btn" title="Tải xuống">
          ⬇️
        </button>

        <button
          className="card-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>

        <button
          className="card-action-btn card-action-btn--del"
          title="Xóa"
          onClick={() => onDelete(doc)}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

/* ── Document Row (List view) ── */
function DocRow({ doc, onEdit, onDelete }) {
  return (
    <div className="doc-list-row">
      <div className="doc-ext-sm" style={{ background: EXT_COLOR[doc.ext] }}>{doc.ext}</div>
      <div className="doc-list-info">
        <p className="doc-list-name">{doc.name}</p>
        <p className="doc-list-sub">{doc.subject}</p>
      </div>
      <div className="doc-list-tags">
        {doc.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
      </div>
      <span className="doc-list-size">{sizeLabel(doc.sizeMB)}</span>
      <span className="doc-list-date">{relativeDate(doc.date)}</span>
      <div className="doc-list-privacy">
        {doc.privacy === 'public' ? <span className="badge-public">🌐</span> : <span className="badge-private">🔒</span>}
      </div>
      <div className="doc-list-actions">
        <button className="row-action-btn" title="Xem trước">
          👁️
        </button>

        <button className="row-action-btn" title="Tải xuống">
          ⬇️
        </button>

        <button
          className="row-action-btn"
          title="Chỉnh sửa"
          onClick={() => onEdit(doc)}
        >
          ✏️
        </button>

        <button
          className="row-action-btn row-action-btn--del"
          title="Xóa"
          onClick={() => onDelete(doc)}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Tất cả");
  const [fileType, setFileType] = useState("Tất cả");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoadingDocs(true);

        const result = await getDocuments();
        const data = result.data || result;
        if (Array.isArray(data) && data.length > 0) console.log('[GET docs] first item:', data[0])
        setDocs(Array.isArray(data) ? data.map(mapApiDoc) : []);
      } catch (error) {
        console.error("Load documents error:", error);
        alert("Không tải được danh sách tài liệu");
      } finally {
        setLoadingDocs(false);
      }
    }

    loadDocuments();
  }, []);

  const filtered = sortDocs(
    docs.filter(d => {
      const q = search.toLowerCase()
      const matchSearch = !q || d.name.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q) || d.tags.some(t => t.toLowerCase().includes(q))
      const matchSubject = subject === 'Tất cả' || d.subject === subject
      const matchType = fileType === 'Tất cả' || d.ext === fileType
      return matchSearch && matchSubject && matchType
    }),
    sort
  )

  const totalSize = docs.reduce((s, d) => s + d.sizeMB, 0).toFixed(1)

  async function handleUploadSuccess(newDoc) {
    try {
      const result = await createDocument({
        documentName: newDoc.name,
        fileType: newDoc.ext,
        previewUrl: newDoc.previewUrl || "",
        downloadUrl: newDoc.downloadUrl || "",
        fileSize: newDoc.fileSize || Math.round((newDoc.sizeMB || 0) * 1024 * 1024),
      });

      const created = result.data || result;
      const actualFileSize = newDoc.fileSize || Math.round((newDoc.sizeMB || 0) * 1024 * 1024)

      setDocs((prev) => [mapApiDoc({ ...created, fileSize: actualFileSize }), ...prev]);
      setShowUpload(false);
    } catch (error) {
      console.error("Create document error:", error);
      alert("Upload tài liệu thất bại");
    }
  }

  async function handleEditSave(updated) {
    try {
      const result = await updateDocument(updated.id, updated.name);
      const data = result.data || result;

      setDocs((prev) =>
        prev.map((d) => (d.id === updated.id ? mapApiDoc(data) : d)),
      );

      setEditDoc(null);
    } catch (error) {
      console.error("Update document error:", error);
      alert("Cập nhật tài liệu thất bại");
    }
  }

  async function handleDeleteConfirm(id) {
    try {
      let fileSize = docs.find(d => d.id === id)?.fileSize || 0
      if (!fileSize) {
        const detail = await getDocumentById(id)
        const d = detail?.data || detail
        fileSize = d?.fileSize || 0
      }
      await deleteDocument(id, fileSize)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      setDeleteDoc(null)
    } catch (error) {
      console.error("Delete document error:", error)
      alert("Xóa tài liệu thất bại")
    }
  }

  return (
    <AppLayout>
      <div className="docs-page">
        <div className="docs-header">
          <div>
            <h1 className="docs-title">Tài liệu của tôi</h1>
            <p className="docs-sub">
              {docs.length} tài liệu · {totalSize} MB đã dùng
            </p>
          </div>

          <button
            className="btn-primary btn-upload"
            onClick={() => setShowUpload(true)}
          >
            ⬆️ Upload tài liệu
          </button>
        </div>

        <div className="docs-toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>

            <input
              className="search-input"
              type="text"
              placeholder="Tìm theo tên, môn học, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              className="filter-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
            >
              {FILE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn${view === "grid" ? " view-btn--active" : ""}`}
              onClick={() => setView("grid")}
              title="Dạng lưới"
            >
              ⊞
            </button>

            <button
              className={`view-btn${view === "list" ? " view-btn--active" : ""}`}
              onClick={() => setView("list")}
              title="Dạng danh sách"
            >
              ☰
            </button>
          </div>
        </div>

        {(search || subject !== "Tất cả" || fileType !== "Tất cả") && (
          <p className="results-label">
            Tìm thấy <strong>{filtered.length}</strong> tài liệu
            {search && (
              <>
                {" "}
                cho "<em>{search}</em>"
              </>
            )}{" "}
            <button
              className="clear-filters"
              onClick={() => {
                setSearch("");
                setSubject("Tất cả");
                setFileType("Tất cả");
              }}
            >
              Xóa bộ lọc
            </button>
          </p>
        )}

        {loadingDocs ? (
          <div className="docs-empty">
            <div className="empty-icon">⏳</div>
            <p className="empty-title">Đang tải tài liệu...</p>
          </div>
        ) : filtered.length > 0 ? (
          view === "grid" ? (
            <div className="docs-grid">
              {filtered.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onEdit={setEditDoc}
                  onDelete={setDeleteDoc}
                />
              ))}
            </div>
          ) : (
            <div className="docs-list">
              <div className="docs-list-header">
                <span style={{ gridColumn: "1 / 3" }}>Tài liệu</span>
                <span>Tag</span>
                <span>Kích thước</span>
                <span>Ngày</span>
                <span>Quyền</span>
                <span>Thao tác</span>
              </div>

              {filtered.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onEdit={setEditDoc}
                  onDelete={setDeleteDoc}
                />
              ))}
            </div>
          )
        ) : (
          <div className="docs-empty">
            <div className="empty-icon">📭</div>

            <p className="empty-title">
              {docs.length === 0
                ? "Chưa có tài liệu nào"
                : "Không tìm thấy tài liệu phù hợp"}
            </p>

            <p className="empty-sub">
              {docs.length === 0
                ? "Bắt đầu bằng cách upload tài liệu đầu tiên của bạn"
                : "Thử thay đổi từ khóa hoặc bộ lọc"}
            </p>

            {docs.length === 0 && (
              <button
                className="btn-primary"
                onClick={() => setShowUpload(true)}
              >
                ⬆️ Upload ngay
              </button>
            )}
          </div>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={handleUploadSuccess} />}
      {editDoc && <EditModal doc={editDoc} onClose={() => setEditDoc(null)} onSave={handleEditSave} />}
      {deleteDoc && <DeleteConfirm doc={deleteDoc} onClose={() => setDeleteDoc(null)} onConfirm={handleDeleteConfirm} />}
    </AppLayout>
  )
}
