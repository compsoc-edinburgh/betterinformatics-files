import * as React from "react";
import { PdfSection } from "../interfaces";
import { SectionRenderer, Dimensions } from "../split-render";
import { css } from "glamor";
import Colors from "../colors";

interface Props {
  section: PdfSection;
  renderer: SectionRenderer;
  width: number;
  dpr: number; // Device Pixel Ratio
  renderText: boolean;
  onClick: (ev: React.MouseEvent<HTMLElement>, section: PdfSection) => void;
}

const styles = {
  wrapper: css({
    position: "relative",
    boxShadow: Colors.cardShadow,
  }),
  lastSection: css({
    marginBottom: "40px",
  }),
  canvas: css({
    display: "block",
  }),
  textLayer: css({
    position: "absolute",
    left: "0",
    right: "0",
    top: "0",
    bottom: "0",
    overflow: "hidden",
    lineHeight: "1.0",
    "& > span": {
      color: "transparent",
      position: "absolute",
      whiteSpace: "pre",
      cursor: "text",
      transformOrigin: "0% 0%",
      "::selection": {
        color: "inherit",
        background: Colors.selectionBackground,
      },
    },
  }),
};

export default class PdfSectionComp extends React.Component<Props> {
  private canv?: HTMLCanvasElement;
  private textWrap?: HTMLDivElement;
  private ctx?: CanvasRenderingContext2D;
  private observer: IntersectionObserver;
  private visible = true;
  private needRender = true;

  componentDidMount() {
    this.needRender = true;
    this.observer = new IntersectionObserver(this.intersectionChanged, {
      threshold: 0,
    });
    if (this.canv) {
      this.observer.observe(this.canv);
    }
  }

  componentDidUpdate(
    prevProps: Readonly<Props>,
    prevState: Readonly<{}>,
  ): void {
    this.needRender = true;
  }

  componentWillUnmount(): void {
    if (this.canv) {
      this.observer.unobserve(this.canv);
    }
    if (this.visible) {
      this.props.renderer.removeVisible(
        this.props.section.start,
        this.renderCanvas,
      );
    }
  }

  intersectionChanged = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      this.visible = entry.isIntersecting;
      if (this.visible) {
        this.props.renderer.addVisible(
          this.props.section.start,
          this.renderCanvas,
        );
        if (this.needRender) {
          this.renderCanvas();
        }
      } else {
        this.props.renderer.removeVisible(
          this.props.section.start,
          this.renderCanvas,
        );
      }
    });
  };

  renderCanvas = () => {
    if (!this.ctx || !this.visible) {
      return;
    }

    const { section, renderer, dpr } = this.props;
    const dim = this.sectionDimensions();
    this.needRender = !renderer.render(
      { context: this.ctx, width: dim.width * dpr, height: dim.height * dpr },
      section.start,
      section.end,
    );
    if (this.textWrap && this.canv) {
      this.props.renderer.renderTextLayer(
        this.textWrap,
        this.canv,
        this.props.section.start,
        this.props.section.end,
        this.props.dpr,
      );
    }
  };

  sectionDimensions = (): Dimensions => {
    const { section, renderer, width } = this.props;
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
    if (this.needRender) {
      this.renderCanvas();
    }
    if (this.textWrap) {
      this.props.renderer.renderTextLayer(
        this.textWrap,
        this.canv,
        this.props.section.start,
        this.props.section.end,
        this.props.dpr,
      );
    }
  };

  saveTextRef = (d: HTMLDivElement) => {
    if (!d) {
      return;
    }
    this.textWrap = d;
    if (this.canv) {
      this.props.renderer.renderTextLayer(
        this.textWrap,
        this.canv,
        this.props.section.start,
        this.props.section.end,
        this.props.dpr,
      );
    }
  };

  render() {
    const { dpr } = this.props;
    const rawDim = this.sectionDimensions();
    return (
      <div
        {...styles.wrapper}
        {...(this.props.section.end.position === 1
          ? styles.lastSection
          : undefined)}
      >
        <canvas
          ref={this.saveCanvasRef}
          width={Math.ceil(rawDim.width * dpr)}
          height={Math.ceil(rawDim.height * dpr)}
          // it would be far nicer to have onClick be undefined if not needed, but ts claims it might be undefined when called...
          onClick={
            this.props.onClick &&
            ((ev: React.MouseEvent<HTMLElement>) =>
              this.props.onClick(ev, this.props.section))
          }
          style={{
            width: Math.ceil(rawDim.width),
            height: Math.ceil(rawDim.height),
          }}
          {...styles.canvas}
        />
        {this.props.renderText && (
          <div {...styles.textLayer} ref={this.saveTextRef} />
        )}
      </div>
    );
  }
}
