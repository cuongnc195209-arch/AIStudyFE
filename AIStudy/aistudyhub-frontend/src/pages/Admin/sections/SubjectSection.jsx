import { useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "../shared/ConfirmModal";
import {
  getDocumentCategories,
  createDocumentCategory,
  updateDocumentCategory,
  deleteDocumentCategory,
} from "../../../apis/documentCategoryApi";

// Backend đôi khi trả nguyên exception kỹ thuật (VD: "org.postgresql.util.PSQLException:
// No results were returned by the query.") thay vì thông báo thân thiện khi xóa thất bại
// vì category vẫn còn tài liệu gắn vào — che lại để người dùng hiểu được vì sao.
function friendlyDeleteError(err) {
  const message = String(err?.message || "");

  if (/PSQLException|SQLException|No results were returned/i.test(message)) {
    return "Danh mục này đang có tài liệu bên trong nên không xóa được. Hãy xóa hoặc chuyển tài liệu đó sang môn khác trước.";
  }

  return message || "Vui lòng thử lại";
}

// Backend không có bảng "semester" riêng và category_type không phải cờ
// SEMESTER/SUBJECT — dữ liệu thật dùng category_type như 1 ô "Mã" tự do
// (VD: PRF192, S1, HK1...). Kì học vs môn học được phân biệt hoàn toàn
// dựa vào parentId: parentId rỗng = kì học (gốc), có parentId = môn thuộc kì đó.
export default function SubjectSection({ onToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [subjectSearch, setSubjectSearch] = useState("");

  const [semesterModal, setSemesterModal] = useState(null); // { mode, id, form: { name, code } }
  const [subjectModal, setSubjectModal] = useState(null); // { mode, id, form: { name, code, parentId } }
  const [confirm, setConfirm] = useState(null); // { type: "semester" | "subject", target }

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);

      try {
        const list = await getDocumentCategories({ page: 0, size: 500 });

        if (!cancelled) {
          setCategories(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Load categories error:", err);
          onToast?.(`Lỗi tải danh mục: ${err?.message || "Vui lòng thử lại"}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const semesters = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  function subjectsOf(semesterId) {
    return categories.filter((c) => c.parentId === semesterId);
  }

  const filteredSemesters = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return semesters;

    return semesters.filter(
      (sem) =>
        sem.label.toLowerCase().includes(q) ||
        (sem.categoryType || "").toLowerCase().includes(q),
    );
  }, [semesters, search]);

  function toggleExpand(id) {
    setExpandedId((cur) => (cur === id ? null : id));
    setSubjectSearch("");
  }

  // ── Kì học ──
  function openAddSemester() {
    setSemesterModal({ mode: "add", id: null, form: { name: "", code: "" } });
  }

  function openEditSemester(sem) {
    setSemesterModal({
      mode: "edit",
      id: sem.id,
      form: { name: sem.label, code: sem.categoryType || "" },
    });
  }

  async function saveSemester() {
    const { form } = semesterModal;
    const name = form.name.trim();

    if (!name) {
      onToast?.("Vui lòng nhập tên kì học");
      return;
    }

    setSaving(true);

    try {
      if (semesterModal.mode === "add") {
        const created = await createDocumentCategory(name, {
          categoryType: form.code.trim(),
          parentId: null,
        });

        setCategories((cur) => [...cur, created]);
        onToast?.(`Đã thêm kì "${created.label}"`);
      } else {
        const updated = await updateDocumentCategory(semesterModal.id, name, {
          categoryType: form.code.trim(),
          parentId: null,
        });

        setCategories((cur) =>
          cur.map((c) =>
            c.id === semesterModal.id ? { ...c, ...updated, label: updated.label || name } : c,
          ),
        );
        onToast?.(`Đã cập nhật kì "${name}"`);
      }

      setSemesterModal(null);
    } catch (err) {
      console.error("Save semester error:", err);
      onToast?.(`Lưu kì học thất bại: ${err?.message || "Vui lòng thử lại"}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Môn học ──
  function openAddSubject(semesterId) {
    setSubjectModal({
      mode: "add",
      id: null,
      form: { name: "", code: "", parentId: semesterId || "" },
    });
  }

  function openEditSubject(sub) {
    setSubjectModal({
      mode: "edit",
      id: sub.id,
      form: { name: sub.label, code: sub.categoryType || "", parentId: sub.parentId || "" },
    });
  }

  async function saveSubject() {
    const { form } = subjectModal;
    const name = form.name.trim();

    if (!name) {
      onToast?.("Vui lòng nhập tên môn học");
      return;
    }

    if (!form.parentId) {
      onToast?.("Vui lòng chọn kì học cho môn này");
      return;
    }

    setSaving(true);

    try {
      if (subjectModal.mode === "add") {
        const created = await createDocumentCategory(name, {
          categoryType: form.code.trim(),
          parentId: form.parentId,
        });

        setCategories((cur) => [...cur, created]);
        onToast?.(`Đã thêm môn "${created.label}"`);
      } else {
        const updated = await updateDocumentCategory(subjectModal.id, name, {
          categoryType: form.code.trim(),
          parentId: form.parentId,
        });

        setCategories((cur) =>
          cur.map((c) =>
            c.id === subjectModal.id ? { ...c, ...updated, label: updated.label || name } : c,
          ),
        );
        onToast?.(`Đã cập nhật môn "${name}"`);
      }

      setSubjectModal(null);
    } catch (err) {
      console.error("Save subject error:", err);
      onToast?.(`Lưu môn học thất bại: ${err?.message || "Vui lòng thử lại"}`);
    } finally {
      setSaving(false);
    }
  }

  // ── Xóa ──
  function requestDeleteSemester(sem) {
    setConfirm({ type: "semester", target: sem, subjectCount: subjectsOf(sem.id).length });
  }

  // Xóa kì kèm theo xóa luôn các môn bên trong — backend không tự cascade
  // (xóa cha chỉ SET NULL parentId của con), nên phải xóa từng môn con trước.
  async function deleteSemesterCascade(sem) {
    const children = subjectsOf(sem.id);

    for (const child of children) {
      await deleteDocumentCategory(child.id);
      setCategories((cur) => cur.filter((c) => c.id !== child.id));
    }

    await deleteDocumentCategory(sem.id);
    setCategories((cur) => cur.filter((c) => c.id !== sem.id));
  }

  async function doDelete() {
    if (!confirm) return;

    try {
      if (confirm.type === "semester") {
        await deleteSemesterCascade(confirm.target);
        onToast?.(`Đã xóa kì "${confirm.target.label}" cùng các môn bên trong`);

        if (expandedId === confirm.target.id) {
          setExpandedId(null);
        }
      } else {
        await deleteDocumentCategory(confirm.target.id);
        setCategories((cur) => cur.filter((c) => c.id !== confirm.target.id));
        onToast?.(`Đã xóa môn "${confirm.target.label}"`);
      }
    } catch (err) {
      console.error("Delete category error:", err);
      onToast?.(`Xóa thất bại: ${friendlyDeleteError(err)}`);
    } finally {
      setConfirm(null);
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý môn học</h2>
        <p>
          {semesters.length} kì học · {categories.length - semesters.length} môn học
        </p>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <span className="admin-search-icon">🔍</span>
          <input
            className="admin-search"
            placeholder="Tìm mã kì, tên kì..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-search-clear" onClick={() => setSearch("")}>
              ✕
            </button>
          )}
        </div>

        <button className="abtn-primary" onClick={openAddSemester}>
          ➕ Thêm kì học
        </button>
      </div>

      {loading ? (
        <div className="table-empty">Đang tải dữ liệu...</div>
      ) : (
        <>
          {filteredSemesters.length === 0 && (
            <div className="table-empty">Không tìm thấy kì học</div>
          )}

          <div className="sem-list">
            {filteredSemesters.map((sem) => {
              const subs = subjectsOf(sem.id);
              const expanded = expandedId === sem.id;
              const q = subjectSearch.toLowerCase().trim();
              const filteredSubs = !q
                ? subs
                : subs.filter(
                    (sub) =>
                      sub.label.toLowerCase().includes(q) ||
                      (sub.categoryType || "").toLowerCase().includes(q),
                  );

              return (
                <div
                  key={sem.id}
                  className={`sem-card${expanded ? " sem-card--expanded" : ""}`}
                >
                  <div className="sem-row" onClick={() => toggleExpand(sem.id)}>
                    <span className="sem-chevron">{expanded ? "▾" : "▸"}</span>
                    {sem.categoryType && (
                      <span className="sem-code-badge">{sem.categoryType}</span>
                    )}
                    <span className="sem-name">{sem.label}</span>
                    <span className="sem-count">{subs.length} môn</span>

                    <div
                      className="td-actions sem-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="ta-btn ta-view" onClick={() => openEditSemester(sem)}>
                        ✏️ Sửa
                      </button>
                      <button
                        className="ta-btn ta-delete"
                        onClick={() => requestDeleteSemester(sem)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="sem-panel">
                      <div className="sem-panel-toolbar">
                        <div className="admin-search-wrap">
                          <span className="admin-search-icon">🔍</span>
                          <input
                            className="admin-search"
                            placeholder="Tìm mã môn, tên môn..."
                            value={subjectSearch}
                            onChange={(e) => setSubjectSearch(e.target.value)}
                          />
                        </div>
                        <button className="abtn-primary" onClick={() => openAddSubject(sem.id)}>
                          ➕ Thêm môn
                        </button>
                      </div>

                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã môn</th>
                              <th>Tên môn</th>
                              <th>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSubs.map((sub) => (
                              <tr key={sub.id}>
                                <td className="td-secondary">{sub.categoryType || "—"}</td>
                                <td>{sub.label}</td>
                                <td>
                                  <div className="td-actions">
                                    <button
                                      className="ta-btn ta-view"
                                      onClick={() => openEditSubject(sub)}
                                    >
                                      ✏️ Sửa
                                    </button>
                                    <button
                                      className="ta-btn ta-delete"
                                      onClick={() => setConfirm({ type: "subject", target: sub })}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {filteredSubs.length === 0 && (
                          <div className="table-empty">
                            {subs.length === 0
                              ? "Kì này chưa có môn nào"
                              : "Không tìm thấy môn học"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {semesterModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSemesterModal(null)}
        >
          <div className="admin-modal admin-modal--sm">
            <div className="admin-modal-header">
              <h3>{semesterModal.mode === "add" ? "Thêm kì học" : "Sửa kì học"}</h3>
              <button className="admin-modal-close" onClick={() => setSemesterModal(null)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Tên kì</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: Học kỳ 1, Summer2026"
                  value={semesterModal.form.name}
                  onChange={(e) =>
                    setSemesterModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Mã (tùy chọn)</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: HK1, S1"
                  value={semesterModal.form.code}
                  onChange={(e) =>
                    setSemesterModal((m) => ({ ...m, form: { ...m.form, code: e.target.value } }))
                  }
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="abtn-cancel" onClick={() => setSemesterModal(null)}>
                Hủy
              </button>
              <button className="abtn-primary" disabled={saving} onClick={saveSemester}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {subjectModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSubjectModal(null)}
        >
          <div className="admin-modal admin-modal--sm">
            <div className="admin-modal-header">
              <h3>{subjectModal.mode === "add" ? "Thêm môn học" : "Sửa môn học"}</h3>
              <button className="admin-modal-close" onClick={() => setSubjectModal(null)}>
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Tên môn</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: Lập trình C"
                  value={subjectModal.form.name}
                  onChange={(e) =>
                    setSubjectModal((m) => ({ ...m, form: { ...m.form, name: e.target.value } }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Mã môn (tùy chọn)</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: PRF192"
                  value={subjectModal.form.code}
                  onChange={(e) =>
                    setSubjectModal((m) => ({ ...m, form: { ...m.form, code: e.target.value } }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Kì học</label>
                <select
                  className="admin-form-input"
                  value={subjectModal.form.parentId}
                  onChange={(e) =>
                    setSubjectModal((m) => ({
                      ...m,
                      form: { ...m.form, parentId: e.target.value },
                    }))
                  }
                >
                  <option value="">-- Chọn kì học --</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.categoryType ? `${sem.categoryType} - ${sem.label}` : sem.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="abtn-cancel" onClick={() => setSubjectModal(null)}>
                Hủy
              </button>
              <button className="abtn-primary" disabled={saving} onClick={saveSubject}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.type === "semester" ? "Xóa kì học" : "Xóa môn học"}
          desc={
            confirm.type === "semester"
              ? confirm.subjectCount > 0
                ? `Kì "${confirm.target.label}" đang có ${confirm.subjectCount} môn học bên trong. Xóa kì sẽ xóa luôn tất cả các môn đó. Bạn có chắc chắn?`
                : `Bạn có chắc muốn xóa kì "${confirm.target.label}"?`
              : `Bạn có chắc muốn xóa môn "${confirm.target.label}"?`
          }
          danger
          onConfirm={doDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
