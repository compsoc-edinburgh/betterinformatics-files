import * as React from "react";
import {renderDocument, SectionRenderer} from "../split-render";
import {loadSections} from "../exam-loader";
import {Section, SectionKind, PdfSection, ExamMetaData} from "../interfaces";
import * as pdfjs from "pdfjs-dist";
import {debounce} from "lodash";
import {css} from "glamor";
import PdfSectionComp from "../components/pdf-section";
import AnswerSectionComponent from "../components/answer-section";
import {fetchpost} from "../fetch-utils";
import MetaData from "../components/metadata";

const RERENDER_INTERVAL = 500;
const MAX_WIDTH = 1200;

const styles = {
  wrapper: css({
    margin: "auto",
  }),
  sectionsButton: css({
    display: "flex",
    justifyContent: "flex-end",
    position: ["sticky", "-webkit-sticky"],
    top: "20px"
  }),
  legacySolution: css({
    background: "#cccccc",
    marginTop: "10px",
    padding: "5px 10px",
    textAlign: "center",
  })
};

interface Props {
  filename: string;
}

interface State {
  pdf?: pdfjs.PDFDocumentProxy;
  renderer?: SectionRenderer;
  width: number;
  dpr: number;
  canEdit: boolean;
  sections?: Section[];
  addingSectionsActive: boolean;
  savedMetaData: ExamMetaData;
  error: boolean;
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
    addingSectionsActive: false,
    canEdit: false,
    savedMetaData: {
      canEdit: false,
      filename: "",
      category: "",
      displayname: "",
      legacy_solution: "",
    },
    error: false,
  };
  updateInverval: NodeJS.Timer;
  debouncedRender: (this["renderDocumentToState"]);

  async componentWillMount() {
    this.updateInverval = setInterval(this.pollZoom, RERENDER_INTERVAL);
    window.addEventListener("resize", this.onResize);
    this.debouncedRender = debounce(this.renderDocumentToState, RERENDER_INTERVAL);

    fetch(`/api/exam/${this.props.filename}/metadata`)
      .then((res) => res.json())
      .then((res) => {
        this.setState({
          canEdit: res.value.canEdit,
          savedMetaData: res.value,
        });
        this.setDocumentTitle();
      })
      .catch(()=>{
        this.setState({error: true});
      });

    // tslint:disable-next-line:no-any
    const PDFJS: pdfjs.PDFJSStatic = pdfjs as any;
    try {
      const pdf = await PDFJS.getDocument("/api/pdf/" + this.props.filename);

      await Promise.all([
        this.renderDocumentToState(pdf),
        this.loadSectionsFromBackend(pdf)
      ]);
    } catch (e) {
      this.setState({
        error: true
      });
    }
  }

  setDocumentTitle() {
    document.title = this.state.savedMetaData.displayname + " - VIS Community Solutions";
  }

  async componentDidMount() {
    this.setDocumentTitle();
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
    this.setState({width: w});
    const {pdf} = this.state;
    if (pdf) {
      this.debouncedRender(pdf);
    }
  };

  pollZoom = () => {
    const dpr = window.devicePixelRatio;
    if (dpr === this.state.dpr) {
      return;
    }
    this.setState({dpr});
    const {pdf} = this.state;
    if (pdf) {
      this.renderDocumentToState(pdf);
    }
  };

  renderDocumentToState = async (pdf: pdfjs.PDFDocumentProxy) => {
    const w = this.state.width * this.state.dpr;
    this.setState({pdf, renderer: await renderDocument(pdf, w)});
  };

  loadSectionsFromBackend = async (pdf: pdfjs.PDFDocumentProxy) => {
    loadSections(this.props.filename, pdf.numPages)
      .then((sections) => {
        this.setState({sections: sections});
      })
      .catch(() => {
        this.setState({error: true});
      });
  };

  addSection = async (ev: React.MouseEvent<HTMLElement>, section: PdfSection) => {
    const boundingRect = ev.currentTarget.getBoundingClientRect();
    const yoff = ev.clientY - boundingRect.top;
    const relative = yoff / boundingRect.height;
    const start = section.start.position;
    const end = section.end.position;
    const relHeight = start + relative * (end - start);

    await fetchpost(`/api/exam/${this.props.filename}/newanswersection`, {
      pageNum: section.start.page,
      relHeight: relHeight
    });
    if (this.state.pdf) {
      this.loadSectionsFromBackend(this.state.pdf);
    }
  };

  toggleAddingSectionActive = () => {
    this.setState((state, props) => {
      return {addingSectionsActive: !state.addingSectionsActive};
    });
  };

  metaDataChanged = (newMetaData: ExamMetaData) => {
    this.setState({
      savedMetaData: newMetaData
    });
    this.setDocumentTitle();
  };

  render() {
    if (this.state.error) {
      return <div>Could not load exam...</div>;
    }
    const {renderer, width, dpr, sections} = this.state;
    if (!renderer || !sections) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        {this.state.canEdit &&
        <div {...styles.sectionsButton}>
          <div>
            <MetaData filename={this.props.filename} savedMetaData={this.state.savedMetaData} onChange={this.metaDataChanged} />
          </div>
          <div><button onClick={this.toggleAddingSectionActive}>{this.state.addingSectionsActive && "Disable Adding Cuts" || "Enable Adding Cuts"}</button></div>
        </div>}
        {this.state.savedMetaData.legacy_solution &&
          <div {...styles.legacySolution}>
            <a href={this.state.savedMetaData.legacy_solution} target="_blank">Legacy Solution in VISki</a>
          </div>}
        <div style={{width: width}} {...styles.wrapper}>
          {sections.map(e => {
            switch (e.kind) {
              case SectionKind.Answer:
                return <AnswerSectionComponent
                  key={e.oid}
                  filename={this.props.filename}
                  oid={e.oid}
                  width={width}
                  canDelete={this.state.canEdit}
                  onSectionChange={() => this.state.pdf ? this.loadSectionsFromBackend(this.state.pdf) : false}
                />;
              case SectionKind.Pdf:
                return (
                  <PdfSectionComp
                    key={e.key}
                    section={e}
                    renderer={renderer}
                    width={width}
                    dpr={dpr}
                    // ts does not like it if this is undefined...
                    onClick={(this.state.canEdit && this.state.addingSectionsActive) ? this.addSection : (ev)=>ev}
                  />
                );
              default:
                return null as never;
            }
          })}
        </div>
      </div>
    );
  }
}
