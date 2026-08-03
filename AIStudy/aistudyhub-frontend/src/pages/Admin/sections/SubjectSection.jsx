import { useMemo, useState } from "react";
import { ConfirmModal } from "../shared/ConfirmModal";

// Dữ liệu mẫu cho giao diện — chưa nối API, CRUD chạy hoàn toàn trên state cục bộ
const INITIAL_SEMESTERS = [
  { id: 1, code: "HK1", name: "Học kỳ 1", order: 1 },
  { id: 2, code: "HK2", name: "Học kỳ 2", order: 2 },
  { id: 3, code: "HK3", name: "Học kỳ 3", order: 3 },
];

const INITIAL_SUBJECTS = [
  { id: 1, code: "PRF192", name: "Lập trình C", semesterId: 1 },
  { id: 2, code: "MAE101", name: "Toán rời rạc", semesterId: 1 },
  { id: 3, code: "CSI104", name: "Nhập môn ngành", semesterId: 1 },
  { id: 4, code: "PRO192", name: "Lập trình hướng đối tượng", semesterId: 2 },
  { id: 5, code: "DBI202", name: "Cơ sở dữ liệu", semesterId: 2 },
  { id: 6, code: "MAD101", name: "Xác suất thống kê", semesterId: 2 },
  { id: 7, code: "WED201c", name: "Phát triển Web", semesterId: 3 },
];

const emptySemesterForm = { code: "", name: "" };
const emptySubjectForm = { code: "", name: "", semesterId: "" };

let nextSemesterId = INITIAL_SEMESTERS.length + 1;
let nextSubjectId = INITIAL_SUBJECTS.length + 1;

export default function SubjectSection({ onToast }) {
  const [semesters, setSemesters] = useState(INITIAL_SEMESTERS);
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(INITIAL_SEMESTERS[0]?.id ?? null);
  const [subjectSearch, setSubjectSearch] = useState("");

  const [semesterModal, setSemesterModal] = useState(null); // { mode, id, form }
  const [subjectModal, setSubjectModal] = useState(null); // { mode, id, form }
  const [confirm, setConfirm] = useState(null); // { type: 'semester' | 'subject', target }

  const filteredSemesters = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? semesters
      : semesters.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q),
        );

    return [...list].sort((a, b) => a.order - b.order);
  }, [semesters, search]);

  function subjectsOf(semesterId) {
    return subjects.filter((sub) => sub.semesterId === semesterId);
  }

  function toggleExpand(semesterId) {
    setExpandedId((cur) => (cur === semesterId ? null : semesterId));
    setSubjectSearch("");
  }

  // ── Kì học ──
  function openAddSemester() {
    setSemesterModal({ mode: "add", id: null, form: { ...emptySemesterForm } });
  }

  function openEditSemester(sem) {
    setSemesterModal({
      mode: "edit",
      id: sem.id,
      form: { code: sem.code, name: sem.name },
    });
  }

  function saveSemester() {
    const { form } = semesterModal;

    if (!form.code.trim() || !form.name.trim()) {
      onToast?.("Vui lòng nhập đầy đủ mã kì và tên kì");
      return;
    }

    if (semesterModal.mode === "add") {
      const newSemester = {
        id: nextSemesterId++,
        code: form.code.trim(),
        name: form.name.trim(),
        order: semesters.length + 1,
      };

      setSemesters((cur) => [...cur, newSemester]);
      onToast?.(`Đã thêm kì "${newSemester.name}"`);
    } else {
      setSemesters((cur) =>
        cur.map((s) =>
          s.id === semesterModal.id
            ? { ...s, code: form.code.trim(), name: form.name.trim() }
            : s,
        ),
      );
      onToast?.(`Đã cập nhật kì "${form.name}"`);
    }

    setSemesterModal(null);
  }

  // ── Môn học ──
  function openAddSubject(semesterId) {
    setSubjectModal({
      mode: "add",
      id: null,
      form: { ...emptySubjectForm, semesterId: semesterId || "" },
    });
  }

  function openEditSubject(sub) {
    setSubjectModal({
      mode: "edit",
      id: sub.id,
      form: {
        code: sub.code,
        name: sub.name,
        semesterId: sub.semesterId ?? "",
      },
    });
  }

  function saveSubject() {
    const { form } = subjectModal;

    if (!form.code.trim() || !form.name.trim() || !form.semesterId) {
      onToast?.("Vui lòng nhập đầy đủ mã môn, tên môn và chọn kì học");
      return;
    }

    const semesterId = Number(form.semesterId);

    if (subjectModal.mode === "add") {
      const newSubject = {
        id: nextSubjectId++,
        code: form.code.trim(),
        name: form.name.trim(),
        semesterId,
      };

      setSubjects((cur) => [...cur, newSubject]);
      onToast?.(`Đã thêm môn "${newSubject.name}"`);
    } else {
      setSubjects((cur) =>
        cur.map((s) =>
          s.id === subjectModal.id
            ? { ...s, code: form.code.trim(), name: form.name.trim(), semesterId }
            : s,
        ),
      );
      onToast?.(`Đã cập nhật môn "${form.name}"`);
    }

    setSubjectModal(null);
  }

  // ── Xóa ──
  function doDelete() {
    if (!confirm) return;

    if (confirm.type === "semester") {
      setSemesters((cur) => cur.filter((s) => s.id !== confirm.target.id));
      setSubjects((cur) => cur.filter((s) => s.semesterId !== confirm.target.id));
      onToast?.(`Đã xóa kì "${confirm.target.name}"`);

      if (expandedId === confirm.target.id) {
        setExpandedId(null);
      }
    } else {
      setSubjects((cur) => cur.filter((s) => s.id !== confirm.target.id));
      onToast?.(`Đã xóa môn "${confirm.target.name}"`);
    }

    setConfirm(null);
  }

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>Quản lý môn học</h2>
        <p>
          {semesters.length} kì học · {subjects.length} môn học
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
            <button
              className="admin-search-clear"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>

        <button className="abtn-primary" onClick={openAddSemester}>
          ➕ Thêm kì học
        </button>
      </div>

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
                  sub.name.toLowerCase().includes(q) ||
                  sub.code.toLowerCase().includes(q),
              );

          return (
            <div
              key={sem.id}
              className={`sem-card${expanded ? " sem-card--expanded" : ""}`}
            >
              <div className="sem-row" onClick={() => toggleExpand(sem.id)}>
                <span className="sem-chevron">{expanded ? "▾" : "▸"}</span>
                <span className="sem-code-badge">{sem.code}</span>
                <span className="sem-name">{sem.name}</span>
                <span className="sem-count">{subs.length} môn</span>

                <div
                  className="td-actions sem-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="ta-btn ta-view"
                    onClick={() => openEditSemester(sem)}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    className="ta-btn ta-delete"
                    onClick={() =>
                      setConfirm({ type: "semester", target: sem })
                    }
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
                    <button
                      className="abtn-primary"
                      onClick={() => openAddSubject(sem.id)}
                    >
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
                            <td className="td-secondary">{sub.code}</td>
                            <td>{sub.name}</td>
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
                                  onClick={() =>
                                    setConfirm({ type: "subject", target: sub })
                                  }
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

      {semesterModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setSemesterModal(null)
          }
        >
          <div className="admin-modal admin-modal--sm">
            <div className="admin-modal-header">
              <h3>
                {semesterModal.mode === "add" ? "Thêm kì học" : "Sửa kì học"}
              </h3>
              <button
                className="admin-modal-close"
                onClick={() => setSemesterModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Mã kì</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: HK1, Spring2024"
                  value={semesterModal.form.code}
                  onChange={(e) =>
                    setSemesterModal((m) => ({
                      ...m,
                      form: { ...m.form, code: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Tên kì</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: Học kỳ 1"
                  value={semesterModal.form.name}
                  onChange={(e) =>
                    setSemesterModal((m) => ({
                      ...m,
                      form: { ...m.form, name: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="abtn-cancel"
                onClick={() => setSemesterModal(null)}
              >
                Hủy
              </button>
              <button className="abtn-primary" onClick={saveSemester}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {subjectModal && (
        <div
          className="admin-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setSubjectModal(null)
          }
        >
          <div className="admin-modal admin-modal--sm">
            <div className="admin-modal-header">
              <h3>
                {subjectModal.mode === "add" ? "Thêm môn học" : "Sửa môn học"}
              </h3>
              <button
                className="admin-modal-close"
                onClick={() => setSubjectModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Mã môn</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: PRF192"
                  value={subjectModal.form.code}
                  onChange={(e) =>
                    setSubjectModal((m) => ({
                      ...m,
                      form: { ...m.form, code: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Tên môn</label>
                <input
                  className="admin-form-input"
                  placeholder="VD: Lập trình C"
                  value={subjectModal.form.name}
                  onChange={(e) =>
                    setSubjectModal((m) => ({
                      ...m,
                      form: { ...m.form, name: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="admin-form-group">
                <label>Kì học</label>
                <select
                  className="admin-form-input"
                  value={subjectModal.form.semesterId}
                  onChange={(e) =>
                    setSubjectModal((m) => ({
                      ...m,
                      form: { ...m.form, semesterId: e.target.value },
                    }))
                  }
                >
                  <option value="">-- Chọn kì học --</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.code} - {sem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="abtn-cancel"
                onClick={() => setSubjectModal(null)}
              >
                Hủy
              </button>
              <button className="abtn-primary" onClick={saveSubject}>
                Lưu
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
              ? `Bạn có chắc muốn xóa kì "${confirm.target.name}"? Toàn bộ môn thuộc kì này sẽ bị xóa theo.`
              : `Bạn có chắc muốn xóa môn "${confirm.target.name}"?`
          }
          danger
          onConfirm={doDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
