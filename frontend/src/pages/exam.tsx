import * as React from "react";
import { renderDocument, SectionRenderer } from "../split-render";
import { SectionKind } from "../interfaces";
import * as pdfjs from "pdfjs-dist";
import { debounce } from "lodash";
import { css } from "glamor";
import PdfSection from "../components/pdf-section";
import AnswerSection from "../components/answer-section";
import { SECTIONS } from "../fake-exam";

const RERENDER_INTERVAL = 500;
const MAX_WIDTH = 1200;

const styles = {
  wrapper: css({
    margin: "auto",
    outline: "1px solid red",
  }),
};

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  width: number;
  dpr: number;
}

function widthFromWindow(): number {
  // This compensates for HTML body padding.
  // TODO use a cleaner approach.
  return Math.max(0, Math.min(MAX_WIDTH, document.body.clientWidth - 16));
}

export default class Exam extends React.Component<{}, State> {
  state: State = {
    width: widthFromWindow(),
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
    const w = widthFromWindow();
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
      <div style={{ width: width }} {...styles.wrapper}>
        {SECTIONS.map(e => {
          switch (e.kind) {
            case SectionKind.Answer:
              return <AnswerSection key={e.key} section={e} width={width} />;
            case SectionKind.Pdf:
              return (
                <PdfSection
                  key={e.key}
                  section={e}
                  renderer={renderer}
                  width={width}
                  dpr={dpr}
                />
              );
            default:
              return null as never;
          }
        })}
      </div>
    );
  }
}
