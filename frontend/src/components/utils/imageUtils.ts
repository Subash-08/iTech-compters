/**
 * Auto detect base URL (local vs production)
 */
export const getBaseURL = (): string => {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return isLocal
    ? "http://localhost:5000"
    : "https://api.itechcomputers.shop";
};

/**
 * SVG placeholder for missing image
 */
export const getPlaceholderImage = (
  text: string = "Image",
  width: number = 300,
  height: number = 300
): string => {
  const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" font-size="14" font-family="Arial" fill="#6B7280" text-anchor="middle" dy=".3em">${text}</text>
      </svg>
    `.replace(/\s+/g, " ");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Extract usable image URL from any format
 */
export const getImageUrl = (image: any): string => {
  if (!image) return getPlaceholderImage("No Image");

  let url = "";

  if (typeof image === "string") url = image;
  else if (typeof image === "object") url = image.url || "";

  if (!url) return getPlaceholderImage("No Image");

  // Absolute URLs / blob / base64 → return as-is
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // Relative path → backend storage
  return `${getBaseURL()}${url.startsWith("/") ? url : "/" + url}`;
};

/**
 * Extract alt text safely
 */
export const getImageAltText = (image: any, fallback: string = ""): string => {
  if (!image) return fallback;
  if (typeof image === "object")
    return image.altText || image.alt || image.name || fallback;
  return fallback;
};

/**
 * Convert full URL → "/uploads/.../filename.jpeg"
 */
export const getImagePathForStorage = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("/uploads/")) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith("/") ? url : `/uploads/products/${url}`;
};


/**
 * Validate file before upload
 */
export const validateImageFile = (
  file: File
): { valid: boolean; error?: string } => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type))
    return { valid: false, error: "Only JPEG / PNG / WebP / GIF allowed" };
  if (file.size > 10 * 1024 * 1024)
    return { valid: false, error: "Image must be <10MB" };
  return { valid: true };
};

/**
 * Upload single image → returns "/uploads/.../filename.jpeg"
 */
export const uploadImage = async (
  file: File,
  entity:
    | "products"
    | "brands"
    | "categories"
    | "users"
    | "hero-slides"
    | "prebuilt-pcs" = "products"
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const check = validateImageFile(file);
  if (!check.valid) return { success: false, error: check.error };

  const form = new FormData();
  form.append("image", file);

  // Check if entity is supported, fallback to products if not
  const supportedEntities = ["products", "categories", "users", "prebuilt-pcs"];
  const uploadEntity = supportedEntities.includes(entity) ? entity : "products";

  try {
    const res = await fetch(`${getBaseURL()}/api/v1/uploads/${uploadEntity}`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url)
      return { success: false, error: data?.message || "Upload failed" };

    return { success: true, url: data.url };
  } catch {
    return { success: false, error: "Network error" };
  }
};
/**
 * Upload multiple images → returns array of DB paths
 */
export const uploadMultipleImages = async (
  files: FileList | File[],
  entity: "products" | "prebuilt-pcs" = "products"
): Promise<string[]> => {
  const results: string[] = [];
  for (const file of Array.from(files)) {
    const r = await uploadImage(file, entity);
    if (r.success && r.url) results.push(r.url);
  }
  return results;
};

/**
 * Normalize single image field for DB
 */
export const normalizeImageField = (img: any): any => {
  if (!img) return null;
  if (typeof img === "string") {
    const url = getImagePathForStorage(img);
    return url ? { url, altText: "" } : null;
  }
  if (img.url) {
    return { ...img, url: getImagePathForStorage(img.url) };
  }
  return null;
};

/**
 * Normalize FULL product image object (thumbnail + hover + gallery + manufacturerImages)
 */
export const normalizeProductImages = (images: any): any => {
  if (!images) return {};

  const result: any = {};

  if (images.thumbnail) {
    const tmp = normalizeImageField(images.thumbnail);
    if (tmp) result.thumbnail = tmp;
  }

  if (images.hoverImage) {
    const tmp = normalizeImageField(images.hoverImage);
    if (tmp) result.hoverImage = tmp;
  }

  if (Array.isArray(images.gallery)) {
    result.gallery = images.gallery.map(normalizeImageField).filter(Boolean);
  }

  if (Array.isArray(images.manufacturerImages)) {
    result.manufacturerImages = images.manufacturerImages
      .map(normalizeImageField)
      .filter(Boolean);
  }

  return result;
};

/**
 * Blob preview helpers
 */
export const createPreviewUrl = (file: File): string =>
  URL.createObjectURL(file);

export const revokePreviewUrl = (url: string): void => {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
};

export default {
  getBaseURL,
  getImageUrl,
  getImageAltText,
  getPlaceholderImage,
  getImagePathForStorage,
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
  normalizeImageField,
  normalizeProductImages,
  createPreviewUrl,
  revokePreviewUrl,
};
