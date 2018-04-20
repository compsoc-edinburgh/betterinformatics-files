import * as React from "react";
import { renderDocument, SectionRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import Exam from "./exam";
import * as pdfjs from "pdfjs-dist";

const SECTIONS: Section[] = [
  {
    key: 0,
    kind: SectionKind.Answer,
  },
  {
    key: 1,
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.2,
    },
    end: {
      page: 1,
      position: 0.5,
    },
  },
];

const WIDTH = 800;

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  dpr: number;
}

export default class App extends React.Component<{}, State> {
  state: State = {
    dpr: window.devicePixelRatio,
  };
  updateInverval: NodeJS.Timer;

  async componentWillMount() {
    this.updateInverval = setInterval(this.updateZoom, 500);

    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    const pdf = await PDFJS.getDocument("/exam10.pdf");
    this.renderDocument(pdf);
  }

  componentWillUnmount() {
    clearInterval(this.updateInverval);
  }

  updateZoom = () => {
    const dpr = window.devicePixelRatio;
    if (dpr === this.state.dpr) {
      return;
    }
    this.setState({ dpr });
    const { pdf } = this.state;
    if (pdf) {
      this.renderDocument(pdf);
    }
  };

  async renderDocument(pdf: pdfjs.PDFDocumentProxy) {
    const w = WIDTH * this.state.dpr;
    this.setState({ pdf, renderer: await renderDocument(pdf, w) });
  }

  render() {
    const { renderer, dpr } = this.state;
    if (!renderer) {
      return <div>Loading...</div>;
    }
    return (
      <Exam sections={SECTIONS} renderer={renderer} width={WIDTH} dpr={dpr} />
    );
  }
}
