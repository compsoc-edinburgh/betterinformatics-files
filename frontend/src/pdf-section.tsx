import * as React from "react";
import { PdfSection } from "./interfaces";
import { SectionRenderer, Dimensions } from "./split-render";

interface Props {
  section: PdfSection;
  renderer: SectionRenderer;
  test?: string;
  width: number;
}

const contentRelevantProps: Array<keyof Props> = ["section", "renderer"];

export default class PdfSectionComp extends React.Component<Props> {
  private ctx?: CanvasRenderingContext2D;
  private lastCtx?: CanvasRenderingContext2D;
  private propsChanged = true;

  componentWillReceiveProps(nextProps: Props) {
    if (contentRelevantProps.some(k => this.props[k] !== nextProps[k])) {
      this.propsChanged = true;
    }
  }

  componentDidMount() {
    this.renderCanvas();
  }

  componentDidRender() {
    this.renderCanvas();
  }

  render() {
    const { section } = this.props;
    const { width, height } = this.sectionDimensions();
    return (
      <div>
        PDF section: {JSON.stringify(section, null, 2)}
        <canvas ref={this.saveCanvasRef} width={width} height={height} />
      </div>
    );
  }

  sectionDimensions(): Dimensions {
    const { section, renderer, width } = this.props;
    return renderer.sectionDimensions(section.start, section.end, width);
  }

  renderCanvas() {
    if (!this.ctx || (!this.propsChanged && this.ctx === this.lastCtx)) {
      return;
    }
    this.lastCtx = this.ctx;
    this.propsChanged = false;

    const { section, renderer } = this.props;
    const dim = this.sectionDimensions();
    renderer.render({ ...dim, context: this.ctx }, section.start, section.end);
  }

  saveCanvasRef = (c: HTMLCanvasElement) => {
    const ctx = c.getContext("2d");
    if (!ctx) {
      // tslint:disable-next-line:no-console
      console.error("couldn't create canvas context");
      return;
    }
    this.ctx = ctx;
  };
}
