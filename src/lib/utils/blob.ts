const DATA_URL_PATTERN = /^data:(.*?);base64$/;

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("BLOB_READ_FAILED"));
    });

    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("BLOB_READ_FAILED"));
    });

    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",", 2);
  if (parts.length !== 2) {
    throw new Error("INVALID_DATA_URL");
  }

  const header = parts[0] ?? "";
  const base64 = parts[1] ?? "";
  const mimeMatch = header.match(DATA_URL_PATTERN);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";

  let binaryString: string;
  if (typeof atob === "function") {
    binaryString = atob(base64);
  } else if (typeof globalThis.atob === "function") {
    binaryString = globalThis.atob(base64);
  } else if (typeof Buffer === "function") {
    binaryString = Buffer.from(base64, "base64").toString("binary");
  } else {
    throw new Error("BASE64_DECODE_UNAVAILABLE");
  }

  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}
