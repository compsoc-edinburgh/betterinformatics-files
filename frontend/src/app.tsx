import * as React from "react";
import { renderDocument, SectionRenderer } from "./split-render";
import { Section, SectionKind } from "./interfaces";
import Exam from "./exam";
import * as pdfjs from "pdfjs-dist";
import { debounce } from "lodash";

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

const RERENDER_INTERVAL = 500;

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  width: number;
  dpr: number;
}

export default class App extends React.Component<{}, State> {
  state: State = {
    width: window.innerWidth,
    dpr: window.devicePixelRatio,
  };
  updateInverval: NodeJS.Timer;
  debouncedRender: this["renderDocument"];

  async componentWillMount() {
    this.updateInverval = setInterval(this.pollZoom, RERENDER_INTERVAL);
    window.addEventListener("resize", this.onResize);
    this.debouncedRender = debounce(this.renderDocument, RERENDER_INTERVAL);

    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    const pdf = await PDFJS.getDocument("/exam10.pdf");
    this.renderDocument(pdf);
  }

  componentWillUnmount() {
    clearInterval(this.updateInverval);
    window.removeEventListener("resize", this.onResize);
  }

  onResize = () => {
    const w = window.innerWidth;
    if (w === this.state.width) {
      return;
    }
    this.setState({ width: w });
    const { pdf } = this.state;
    if (pdf) {
      this.debouncedRender(pdf);
    }
  };

  pollZoom = () => {
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
    const w = this.state.width * this.state.dpr;
    this.setState({ pdf, renderer: await renderDocument(pdf, w) });
  }

  render() {
    const { renderer, width, dpr } = this.state;
    if (!renderer) {
      return <div>Loading...</div>;
    }
    return (
      <Exam sections={SECTIONS} renderer={renderer} width={width} dpr={dpr} />
    );
  }
}
