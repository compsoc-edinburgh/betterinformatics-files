import * as React from "react";
import { renderDocument, SectionRenderer } from "../split-render";
import { loadSections } from "../exam-loader";
import { Section, SectionKind } from "../interfaces";
import * as pdfjs from "pdfjs-dist";
import { debounce } from "lodash";
import { css } from "glamor";
import PdfSection from "../components/pdf-section";
import AnswerSectionComponent from "../components/answer-section";

const RERENDER_INTERVAL = 500;
const MAX_WIDTH = 1200;

const styles = {
  wrapper: css({
    margin: "auto",
    outline: "1px solid red",
  }),
};

interface Props {
  filename: string;
  isAdmin: boolean;
}

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  width: number;
  dpr: number;
  sections?: Section[];
}

function widthFromWindow(): number {
  // This compensates for HTML body padding.
  // TODO use a cleaner approach.
  return Math.max(0, Math.min(MAX_WIDTH, document.body.clientWidth - 16));
}

export default class Exam extends React.Component<Props, State> {
  state: State = {
    width: widthFromWindow(),
    dpr: window.devicePixelRatio,
  };
  updateInverval: NodeJS.Timer;
  debouncedRender: (this["renderDocumentToState"]);

  async componentWillMount() {
    this.updateInverval = setInterval(this.pollZoom, RERENDER_INTERVAL);
    window.addEventListener("resize", this.onResize);
    this.debouncedRender = debounce(this.renderDocumentToState, RERENDER_INTERVAL);

    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    try {
      const pdf = await PDFJS.getDocument("/api/pdf/" + this.props.filename);

      await Promise.all([
        this.renderDocumentToState(pdf),
        this.loadSectionsFromBackend(pdf)
      ]);
    } catch (e) {
      // TODO implement proper error handling
      console.log(e);
    }
  }

  async componentDidMount() {
      document.title = "VIS-Exchange: " + this.props.filename;
  }

  componentWillUnmount() {
    clearInterval(this.updateInverval);
    window.removeEventListener("resize", this.onResize);
    this.setState({
      pdf: undefined,
      renderer: undefined
    });
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
      this.renderDocumentToState(pdf);
    }
  };

  renderDocumentToState = async (pdf: pdfjs.PDFDocumentProxy) => {
    const w = this.state.width * this.state.dpr;
    this.setState({ pdf, renderer: await renderDocument(pdf, w) });
  };

  loadSectionsFromBackend = async (pdf: pdfjs.PDFDocumentProxy) => {
    loadSections(this.props.filename, pdf.numPages).then((sections) => {
      this.setState({ sections: sections });
    });
  };

  render() {
    const { renderer, width, dpr, sections } = this.state;
    if (!renderer || !sections) {
      return <div>Loading...</div>;
    }
    return (
      <div style={{ width: width }} {...styles.wrapper}>
        {sections.map(e => {
          switch (e.kind) {
            case SectionKind.Answer:
              return <AnswerSectionComponent
                  key={e.oid}
                  filename={this.props.filename}
                  oid={e.oid}
                  width={width}
                  onSectionChange={() => this.state.pdf ? this.loadSectionsFromBackend(this.state.pdf) : false}
              />;
            case SectionKind.Pdf:
              return (
                <PdfSection
                  key={e.key}
                  section={e}
                  renderer={renderer}
                  width={width}
                  dpr={dpr}
                  isAdmin={this.props.isAdmin}
                  filename={this.props.filename}
                  onSectionChange={() => this.state.pdf ? this.loadSectionsFromBackend(this.state.pdf) : false}
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
