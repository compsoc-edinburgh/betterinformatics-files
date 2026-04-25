export interface ZipFileItem {
  displayName: string;
  filename: string;
  file: Promise<ArrayBuffer> | ArrayBuffer;
}

type ZipFileArrayItem = ZipFileItem | undefined;

export async function downloadZipFile(
  zipFileName: string,
  files: (ZipFileArrayItem | Promise<ZipFileArrayItem>)[],
) {
  const JSZip = await import("jszip").then(e => e.default);
  const zip = new JSZip();

  // this is here to check for duplicate filenames and count them
  const fileNames = new Map<string, number>();

  await Promise.all(
    files.map(async item => {
      const resolved = await item;
      if (!resolved) return;

      const { displayName: displayName_, filename, file } = resolved;

      const ext = filename.split(".").at(-1);

      let displayName = displayName_;
      if (ext && !displayName.endsWith(`.${ext}`)) {
        displayName += `.${ext}`;
      }

      const repNum = fileNames.get(displayName);
      if (repNum === undefined) {
        fileNames.set(displayName, 1);
      } else {
        fileNames.set(displayName, repNum + 1);

        const dotIndex = displayName.lastIndexOf(".");
        if (dotIndex === -1) {
          displayName += ` (${repNum})`;
        } else {
          displayName = `${displayName.slice(0, dotIndex)} (${repNum})${displayName.slice(dotIndex)}`;
        }
      }

      zip.file(displayName, file);
    }),
  );

  const generatedZip = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(generatedZip);

  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setImmediate(() => {
    URL.revokeObjectURL(url);
  });
}
