import * as React from "react";
import {PdfSection} from "../interfaces";
import {SectionRenderer, Dimensions} from "../split-render";
import {css} from "glamor";

interface Props {
  section: PdfSection;
  renderer: SectionRenderer;
  width: number;
  dpr: number; // Device Pixel Ratio
  onClick: ((ev: React.MouseEvent<HTMLElement>, section: PdfSection) => void);
}

const styles = {
  canvas: css({
    display: "block",
  }),
};

export default class PdfSectionComp extends React.Component<Props> {
  private canv?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private observer: IntersectionObserver;
  private visible: boolean = true;

  componentDidMount() {
    this.observer = new IntersectionObserver(this.intersectionChanged, {
      threshold: 0,
    });
    if (this.canv) {
      this.observer.observe(this.canv);
    }
  }

  componentWillUnmount(): void {
    if (this.canv) {
      this.observer.unobserve(this.canv);
    }
    if (this.visible) {
      this.props.renderer.removeVisible(this.props.section.start, this.renderCanvas);
    }
  }

  componentDidUpdate() {
    this.renderCanvas();
  }

  intersectionChanged = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      this.visible = entry.isIntersecting;
      if (this.visible) {
        this.props.renderer.addVisible(this.props.section.start, this.renderCanvas);
      } else {
        this.props.renderer.removeVisible(this.props.section.start, this.renderCanvas);
      }
    });
  };

  renderCanvas = () => {
    if (!this.ctx || !this.visible) {
      return;
    }

    const {section, renderer, dpr} = this.props;
    const dim = this.sectionDimensions();
    renderer.render(
      {context: this.ctx, width: dim.width * dpr, height: dim.height * dpr},
      section.start,
      section.end,
    );
  };

  sectionDimensions = (): Dimensions => {
    const {section, renderer, width} = this.props;
    return renderer.sectionDimensions(section.start, section.end, width);
  };

  saveCanvasRef = (c: HTMLCanvasElement) => {
    if (!c) {
      return;
    }
    if (this.observer) {
      if (this.canv) {
        this.observer.unobserve(this.canv);
      }
      this.observer.observe(c);
    }
    this.canv = c;
    const ctx = c.getContext("2d");
    if (!ctx) {
      // tslint:disable-next-line:no-console
      console.error("couldn't create canvas context");
      return;
    }
    this.ctx = ctx;
  };

  render() {
    const {dpr} = this.props;
    const rawDim = this.sectionDimensions();
    return (
      <canvas
        ref={this.saveCanvasRef}
        width={Math.ceil(rawDim.width * dpr)}
        height={Math.ceil(rawDim.height * dpr)}
        // it would be far nicer to have onClick be undefined if not needed, but ts claims it might be undefined when called...
        onClick={this.props.onClick && ((ev: React.MouseEvent<HTMLElement>) => this.props.onClick(ev, this.props.section))}
        style={{
          width: Math.ceil(rawDim.width),
          height: Math.ceil(rawDim.height),
        }}
        {...styles.canvas}
      />
    );
  }
}
