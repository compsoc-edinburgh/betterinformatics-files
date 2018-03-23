import * as React from "react";
import { PdfSection } from "./interfaces";
import { DocumentRenderer } from "./split-render";

interface Props {
  section: PdfSection;
  renderer: DocumentRenderer;
}

export default ({ section }: Props) => (
  <div>PDF section: {JSON.stringify(section, null, 2)}</div>
);
