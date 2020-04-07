import React, { useState, useMemo, useEffect } from "react";
import {
  ExamMetaData,
  Section,
  SectionKind,
  EditMode,
  EditState,
  CutVersions,
  PdfSection,
} from "../interfaces";
import AnswerSectionComponent from "./answer-section";
import PdfSectionCanvas from "../pdf/pdf-section-canvas";
import { useRequest } from "@umijs/hooks";
import { loadCutVersions } from "../api/hooks";
import useSet from "../hooks/useSet";
import PDF from "../pdf/pdf-renderer";
import { fetchGet } from "../api/fetch-utils";

interface Props {
  metaData: ExamMetaData;
  sections: Section[];
  width: number;
  editState: EditState;
  setEditState: (newEditState: EditState) => void;
  reloadCuts: () => void;
  renderer: PDF;
  onCutNameChange: (oid: string, name: string) => void;
  onAddCut: (filename: string, page: number, height: number) => void;
  onMoveCut: (
    filename: string,
    cut: string,
    page: number,
    height: number,
  ) => void;
  visibleChangeListener: (section: PdfSection, v: boolean) => void;
}
function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
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
    onCutNameChange,
    onAddCut,
    onMoveCut,
    visibleChangeListener,
  }) => {
    const [visible, show, hide] = useSet<string>();
    const [cutVersions, setCutVersions] = useState<CutVersions>({});
    useRequest(() => loadCutVersions(metaData.filename), {
      manual: true,
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
        fetchGet(`/api/exam/answer/${hash}`)
          .then(res => {
            if (cancelled) return;
            const sectionId = res.value.sectionId;
            show(sectionId);
          })
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }, [hash, show, sections]);
    const onChangeListeners = useMemo(
      () =>
        Object.fromEntries(
          sections
            .map(section =>
              section.kind === SectionKind.Pdf
                ? ([
                    section.key,
                    (v: boolean) => visibleChangeListener(section, v),
                  ] as const)
                : undefined,
            )
            .filter(notUndefined),
        ),
      [sections, visibleChangeListener],
    );
    const addCutHandlers = useMemo(
      () =>
        Object.fromEntries(
          sections
            .map(section =>
              section.kind === SectionKind.Pdf
                ? ([
                    section.key,
                    (height: number) =>
                      editState.mode === EditMode.Add
                        ? onAddCut(
                            metaData.filename,
                            section.start.page,
                            height,
                          )
                        : editState.mode === EditMode.Move
                        ? onMoveCut(
                            metaData.filename,
                            editState.cut,
                            section.start.page,
                            height,
                          )
                        : undefined,
                  ] as const)
                : undefined,
            )
            .filter(notUndefined),
        ),
      [sections, metaData, editState, onAddCut, onMoveCut],
    );
    return (
      <>
        {sections.map(section =>
          section.kind === SectionKind.Answer ? (
            <AnswerSectionComponent
              key={section.oid}
              oid={section.oid}
              onSectionChange={reloadCuts}
              onToggleHidden={() =>
                visible.has(section.oid) ? hide(section.oid) : show(section.oid)
              }
              cutName={section.name}
              onCutNameChange={(newName: string) =>
                onCutNameChange(section.oid, newName)
              }
              hidden={!visible.has(section.oid)}
              cutVersion={cutVersions[section.oid] || section.cutVersion}
              setCutVersion={newVersion =>
                setCutVersions(oldVersions => ({
                  ...oldVersions,
                  [section.oid]: newVersion,
                }))
              }
              onCancelMove={() => setEditState({ mode: EditMode.None })}
              onMove={() =>
                setEditState({ mode: EditMode.Move, cut: section.oid, snap })
              }
              isBeingMoved={
                editState.mode === EditMode.Move &&
                editState.cut === section.oid
              }
            />
          ) : (
            <React.Fragment key={section.key}>
              {pageCounter < section.start.page && ++pageCounter && (
                <div id={`page-${pageCounter}`} />
              )}
              {renderer && (
                <PdfSectionCanvas
                  section={section}
                  renderer={renderer}
                  targetWidth={width}
                  onVisibleChange={onChangeListeners[section.key]}
                  addCutText={addCutText}
                  snap={snap}
                  onAddCut={addCutHandlers[section.key]}
                />
              )}
            </React.Fragment>
          ),
        )}
      </>
    );
  },
);
export default Exam;
