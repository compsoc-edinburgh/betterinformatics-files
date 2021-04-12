import { useState, useEffect, useCallback } from "react";
import { download } from "../api/fetch-utils";
import { Document } from "../interfaces";

export const useDocumentDownload = (doc: Document | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (doc === undefined) return;
    if (!isLoading) return;
    const controllers: AbortController[] = [];
    let cancel = false;

    const abort = () => {
      cancel = true;
      for (const controller of controllers) {
        controller.abort();
      }
    };

    (async () => {
      if (doc.files.length === 0) return;
      if (doc.files.length === 1) {
        download(`/api/document/file/${doc.files[0].filename}`);
        setIsLoading(false);
        return;
      }

      const JSZip = await import("jszip").then(e => e.default);
      if (cancel) return;
      const zip = new JSZip();

      await Promise.all(
        doc.files.map(async file => {
          const controller =
            window.AbortController !== undefined
              ? new AbortController()
              : undefined;
          if (controller !== undefined) controllers.push(controller);
          const responseFile = await fetch(
            `/api/document/file/${file.filename}`,
            {
              signal: controller?.signal,
            },
          )
            .then(r => r.arrayBuffer())
            .catch(e => {
              if (
                window.DOMException !== undefined &&
                e instanceof DOMException &&
                e.name === "AbortError"
              )
                return;
              console.error(e);
              abort();
            });
          if (cancel) return;
          if (responseFile === undefined) return;
          const ext = file.filename.substr(file.filename.lastIndexOf("."));
          zip.file(file.display_name + ext, responseFile);
        }),
      );
      if (cancel) return;

      const content = await zip.generateAsync({ type: "blob" });
      if (cancel) return;
      const name = `${doc.display_name}.zip`;
      const url = window.URL.createObjectURL(content);

      const a = document.createElement("a");
      a.href = url;
      a.download = name;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsLoading(false);
    })();

    return abort;
  }, [isLoading, doc]);
  const startDownload = useCallback(() => setIsLoading(true), []);
  return [isLoading, startDownload] as const;
};
