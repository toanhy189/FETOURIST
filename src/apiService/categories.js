import { privateRequest } from "@/apiService/AxiosInstance/AxiosInstance";
import { fetchApi, toAssetUrl } from "@/apiService/base";

function mapCategory(category) {
  // Map payload MongoDB/TRAVELPTIT ve shape gon hon de UI dùng thống nhất.
  return {
    id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description || "Danh mục giúp bạn lọc tour nhanh hơn.",
    imageUrl: toAssetUrl(category.imageUrl),
    isActive: category.isActive ?? true,
    sortOrder: category.sortOrder ?? 0,
    parentCategory: category.parentCategory
      ? {
          id: category.parentCategory._id,
          name: category.parentCategory.name,
          slug: category.parentCategory.slug,
          isActive: category.parentCategory.isActive ?? true,
        }
      : null,
    createdBy: category.createdBy
      ? {
          id: category.createdBy._id,
          fullName: category.createdBy.fullName,
          email: category.createdBy.email,
          role: category.createdBy.role,
        }
      : null,
    createdAt: category.createdAt || null,
    updatedAt: category.updatedAt || null,
  };
}

export async function getCategories(searchParams = {}) {
  // Public categories dung cho homepage, bộ lọc danh mục va trang kham pha.
  const response = await fetchApi("/api/categories", {
    searchParams,
    next: { revalidate: 60 },
  });

  return {
    categories: Array.isArray(response.data) ? response.data.map(mapCategory) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getCategoriesForAdmin(searchParams = {}) {
  // Admin route can token va trả về dữ liệu day du hon cho man quản trị.
  const response = await privateRequest("/api/categories/admin/all", {
    searchParams,
  });

  return {
    categories: Array.isArray(response.data) ? response.data.map(mapCategory) : [],
    pagination: response.pagination ?? null,
    message: response.message,
  };
}

export async function getCategoryDetailForAdmin(idOrSlug) {
  // Chap nhan id hoặc slug de panel admin co the goi linh hoat hon.
  const response = await privateRequest(`/api/categories/admin/${idOrSlug}`);
  return mapCategory(response.data);
}

export async function createCategory(payload) {
  // Payload được gửi nguyen trang vi backend da chiu trach nhiem validate.
  const response = await privateRequest("/api/categories", {
    method: "POST",
    data: payload,
  });

  return mapCategory(response.data);
}

export async function updateCategory(categoryId, payload) {
  // Patch category va map lai ngay de UI không phải tu xử lý shape response.
  const response = await privateRequest(`/api/categories/${categoryId}`, {
    method: "PATCH",
    data: payload,
  });

  return mapCategory(response.data);
}

export async function uploadCategoryImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await privateRequest("/api/categories/upload-image", {
    method: "POST",
    data: formData,
  });

  return {
    ...response.data,
    url: toAssetUrl(response.data?.url) || "",
  };
}

export async function deleteCategory(categoryId) {
  // Delete không cần map vi BE trả về object xác nhận da xoa.
  const response = await privateRequest(`/api/categories/${categoryId}`, {
    method: "DELETE",
  });

  return response.data;
}
