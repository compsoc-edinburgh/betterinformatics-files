import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ExamMetaData,
  Section,
  SectionKind,
  EditMode,
  EditState,
  CutVersions,
  PdfSection,
  CutUpdate,
} from "../interfaces";
import AnswerSectionComponent from "./answer-section";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import { useRequest } from "@umijs/hooks";
import { loadCutVersions } from "../api/hooks";
import PDF from "../pdf/pdf-renderer";
import { fetchGet } from "../api/fetch-utils";
import { getAnswerSectionId } from "../utils/exam-utils";

interface Props {
  metaData: ExamMetaData;
  sections: Section[];
  width: number;
  editState: EditState;
  setEditState: (newEditState: EditState) => void;
  reloadCuts: () => void;
  renderer: PDF;
  onUpdateCut: (
    section: string | [number, number],
    update: Partial<CutUpdate>,
  ) => Promise<void>;
  onAddCut: (filename: string, page: number, height: number) => void;
  onMoveCut: (cut: string, update: Partial<CutUpdate>) => void;
  inViewChangeListener: (section: PdfSection, v: boolean) => void;
  displayHiddenPdfSections?: boolean;
  displayHiddenAnswerSections?: boolean;
  displayHideShowButtons?: boolean;
  displayEmptyCutLabels?: boolean;

  expandedSections: Set<string>;
  onExpandSections: (...sections: string[]) => void;
  onCollapseSections: (...sections: string[]) => void;
}
function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
function compactMap<S, T>(array: T[], fn: (arg: T) => S | undefined) {
  return array.map(fn).filter(notUndefined);
}
function objectFromMap<S, T, K extends string | number | symbol>(
  array: T[],
  fn: (arg: T) => readonly [K, S] | undefined,
) {
  return Object.fromEntries(compactMap(array, fn)) as Record<K, S>;
}
function useObjectFromMap<S, T, K extends string | number | symbol>(
  array: T[],
  fn: (arg: T) => readonly [K, S] | undefined,
  deps: any[],
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => objectFromMap(array, fn), [array, fn, ...deps]);
}

const Exam: React.FC<Props> = React.memo(
  ({
    metaData,
    sections,
    width,
    editState,
    setEditState,
    reloadCuts,
    renderer,
    onAddCut,
    onUpdateCut,
    onMoveCut,
    inViewChangeListener,
    displayHiddenPdfSections = false,
    displayHiddenAnswerSections = false,
    displayHideShowButtons = true,
    displayEmptyCutLabels = false,
    expandedSections,
    onExpandSections,
    onCollapseSections,
  }) => {
    const getAddCutHandler = useCallback(
      (section: PdfSection) => {
        return (height: number) => {
          if (editState.mode === EditMode.Add) {
            onAddCut(metaData.filename, section.start.page, height);
          } else if (editState.mode === EditMode.Move) {
            onMoveCut(editState.cut, {
              filename: metaData.filename,
              pageNum: section.start.page,
              relHeight: height,
            });
          }
        };
      },
      [editState, metaData.filename, onAddCut, onMoveCut],
    );

    const [cutVersions, setCutVersions] = useState<CutVersions>({});
    useRequest(() => loadCutVersions(metaData.filename), {
      pollingInterval: 60_000,
      onSuccess: response => {
        setCutVersions(oldVersions => ({ ...oldVersions, ...response }));
      },
    });
    const snap =
      editState.mode === EditMode.Add || editState.mode === EditMode.Move
        ? editState.snap
        : true;
    let pageCounter = 0;
    const addCutText =
      editState.mode === EditMode.Add
        ? "Add Cut"
        : editState.mode === EditMode.Move
          ? "Move Cut"
          : undefined;
    const hash = document.location.hash.substr(1);
    useEffect(() => {
      let cancelled = false;
      if (hash.length > 0) {
        fetchGet(`/api/exam/answer/${hash}/`)
          .then(res => {
            if (cancelled) return;
            const sectionId = res.value.sectionId;
            onExpandSections(sectionId);
          })
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }, [hash, onExpandSections]);
    const onChangeListeners = useObjectFromMap(
      sections,
      section => {
        if (section.kind === SectionKind.Pdf) {
          return [
            section.key,
            (v: boolean) => inViewChangeListener(section, v),
          ];
        } else {
          return undefined;
        }
      },
      [sections, inViewChangeListener],
    );
    const addCutHandlers = useObjectFromMap(
      sections,
      section => {
        if (section.kind === SectionKind.Pdf) {
          return [section.key, getAddCutHandler(section)];
        } else {
          return undefined;
        }
      },
      [sections, getAddCutHandler],
    );
    return (
      <>
        {sections.map(section => {
          if (section.kind === SectionKind.Answer) {
            if (displayHiddenAnswerSections || section.has_answers) {
              return (
                <AnswerSectionComponent
                  displayEmptyCutLabels={displayEmptyCutLabels}
                  displayHideShowButtons={displayHideShowButtons}
                  key={section.oid}
                  oid={section.oid}
                  onSectionChange={reloadCuts}
                  onToggleHidden={() =>
                    expandedSections.has(section.oid)
                      ? onCollapseSections(section.oid)
                      : onExpandSections(section.oid)
                  }
                  cutName={section.name}
                  onCutNameChange={(name: string) =>
                    onUpdateCut(section.oid, { name })
                  }
                  onHasAnswersChange={() =>
                    onUpdateCut(section.oid, {
                      has_answers: !section.has_answers,
                    })
                  }
                  hidden={!expandedSections.has(section.oid)}
                  has_answers={section.has_answers}
                  cutVersion={cutVersions[section.oid] || section.cutVersion}
                  setCutVersion={newVersion =>
                    setCutVersions(oldVersions => ({
                      ...oldVersions,
                      [section.oid]: newVersion,
                    }))
                  }
                  onCancelMove={() => setEditState({ mode: EditMode.None })}
                  onMove={() =>
                    setEditState({
                      mode: EditMode.Move,
                      cut: section.oid,
                      snap,
                    })
                  }
                  isBeingMoved={
                    editState.mode === EditMode.Move &&
                    editState.cut === section.oid
                  }
                />
              );
            } else {
              // Return empty div so that jumping to hidden section from contents is still possible
              const id = getAnswerSectionId(section.oid, section.name);
              return (
                <div
                  id={id}
                  key={section.oid}
                  style={{ visibility: "hidden" }}
                />
              );
            }
          } else {
            if (displayHiddenPdfSections || !section.hidden) {
              return (
                <React.Fragment key={section.key}>
                  {pageCounter < section.start.page && ++pageCounter && (
                    <div id={`page-${pageCounter}`} key={section.key} />
                  )}
                  {renderer && (
                    <PdfSectionCanvas
                      /* PDF cut data */
                      oid={section.cutOid}
                      page={section.start.page}
                      start={section.start.position}
                      end={section.end.position}
                      hidden={section.hidden}
                      /* Handler */
                      onSectionHiddenChange={onUpdateCut}
                      displayHideShowButtons={displayHideShowButtons}
                      renderer={renderer}
                      targetWidth={width}
                      onInViewChange={onChangeListeners[section.key]}
                      /* Add cut */
                      snap={snap}
                      addCutText={addCutText}
                      onAddCut={addCutHandlers[section.key]}
                    />
                  )}
                </React.Fragment>
              );
            } else {
              return null;
            }
          }
        })}
      </>
    );
  },
);
export default Exam;
