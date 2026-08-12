const previewMaxEdge = 960;
const previewQuality = 0.82;

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export async function createImagePreviewDataUrl(file: File): Promise<string | undefined> {
  if (!isImageFile(file)) return undefined;

  const dataUrl = await readFileAsDataUrl(file);
  try {
    const image = await loadImage(dataUrl);
    const scale = Math.min(1, previewMaxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) return dataUrl;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", previewQuality);
  } catch {
    return dataUrl;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível gerar a miniatura da imagem."));
    image.src = src;
  });
}
