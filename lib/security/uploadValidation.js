const BASE64_IMAGE_REGEX = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

function estimateBase64Bytes(base64String) {
  const cleaned = base64String.split(',')[1] || '';
  return Math.ceil((cleaned.length * 3) / 4);
}

export function validateImageFiles(files, { maxImages = 5, maxFileBytes = 5 * 1024 * 1024 } = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, error: 'At least one image is required.' };
  }

  if (files.length > maxImages) {
    return { ok: false, error: `You can upload up to ${maxImages} images.` };
  }

  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== 'function') {
      return { ok: false, error: 'Invalid file upload received.' };
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return { ok: false, error: 'Only PNG, JPG, JPEG, and WEBP images are allowed.' };
    }

    if (typeof file.size === 'number' && file.size > maxFileBytes) {
      return { ok: false, error: `Each image must be smaller than ${Math.round(maxFileBytes / (1024 * 1024))}MB.` };
    }
  }

  return { ok: true };
}

export function validateBase64Images(images, { maxImages = 5, maxFileBytes = 5 * 1024 * 1024 } = {}) {
  if (!Array.isArray(images)) {
    return { ok: false, error: 'Images must be sent as an array.' };
  }

  if (images.length > maxImages) {
    return { ok: false, error: `You can upload up to ${maxImages} images.` };
  }

  for (const image of images) {
    if (typeof image !== 'string' || !BASE64_IMAGE_REGEX.test(image)) {
      return { ok: false, error: 'Only PNG, JPG, JPEG, and WEBP images are allowed.' };
    }

    if (estimateBase64Bytes(image) > maxFileBytes) {
      return { ok: false, error: `Each image must be smaller than ${Math.round(maxFileBytes / (1024 * 1024))}MB.` };
    }
  }

  return { ok: true };
}
