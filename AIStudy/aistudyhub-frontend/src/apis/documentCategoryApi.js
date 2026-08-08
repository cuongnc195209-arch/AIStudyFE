import api from "./api";

function unwrapPageData(result) {
  const data = result?.data || result;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.content)) return data.data.content;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function normalizeCategory(category) {
  const id =
    category?.id ||
    category?.categoryId ||
    category?.category_id ||
    category?.value;

  const label =
    category?.categoryName ||
    category?.category_name ||
    category?.name ||
    category?.label ||
    category?.subjectName ||
    category?.subjectCode;

  if (!id) return null;

  return {
    id: String(id),
    value: String(id),
    label: String(label || id),
    categoryName: String(label || id),
    categoryType:
      category?.categoryType || category?.category_type || "SUBJECT",
    parentId: category?.parentId || category?.parentCategoryId || null,
    raw: category,
  };
}

export async function getDocumentCategories({ page = 0, size = 500 } = {}) {
  const result = await api.get("/document-category/all", {
    page,
    size,
  });

  return unwrapPageData(result).map(normalizeCategory).filter(Boolean);
}

export async function createDocumentCategory(categoryName) {
  const cleanName = String(categoryName || "").trim();

  if (!cleanName) {
    throw new Error("Vui lòng nhập môn học");
  }

  const result = await api.post("/document-category/add", {
    categoryName: cleanName,
    categoryType: "SUBJECT",
  });

  const data = result?.data || result;
  const normalized = normalizeCategory(data);

  if (!normalized?.id) {
    throw new Error("Không thể tạo môn học mới");
  }

  return normalized;
}

export async function findOrCreateDocumentCategory(
  categoryName,
  categories = [],
) {
  const cleanName = String(categoryName || "").trim();

  if (!cleanName) {
    throw new Error("Vui lòng nhập môn học");
  }

  const existed = categories.find((category) => {
    const label = String(category.label || category.categoryName || "").trim();
    return label.toLowerCase() === cleanName.toLowerCase();
  });

  if (existed?.id) {
    return existed;
  }

  return createDocumentCategory(cleanName);
}

const documentCategoryApi = {
  getDocumentCategories,
  createDocumentCategory,
  findOrCreateDocumentCategory,
};

export default documentCategoryApi;
