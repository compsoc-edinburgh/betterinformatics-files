import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardHeader,
  Container,
  ListGroup,
  ListGroupItem,
  Spinner,
  Table,
} from "@vseth/components";
import { BreadcrumbItem } from "@vseth/components/dist/components/Breadcrumb/Breadcrumb";
import { css } from "emotion";
import React, { useCallback, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { getCookie } from "../api/fetch-utils";
import {
  claimExam,
  loadCategoryMetaData,
  loadList,
  loadMetaCategories,
} from "../api/hooks";
import { UserContext, useUser } from "../auth";
import { getMetaCategoriesForCategory } from "../category-utils";
import CategoryMetaDataEditor from "../components/category-metadata-editor";
import ClaimButton from "../components/claim-button";
import IconButton from "../components/icon-button";
import TwoButtons from "../components/two-buttons";
import useSet from "../hooks/useSet";
import { CategoryExam, CategoryMetaData } from "../interfaces";

const mapExamsToExamType = (exams: CategoryExam[]) => {
  return [
    ...exams
      .reduce((map, exam) => {
        const examtype = exam.examtype ?? "Exams";
        const arr = map.get(examtype);
        if (arr) {
          arr.push(exam);
        } else {
          map.set(examtype, [exam]);
        }
        return map;
      }, new Map<string, CategoryExam[]>())
      .entries(),
  ].sort(([a], [b]) => a.localeCompare(b));
};
const dlSelectedExams = (selectedExams: Set<string>) => {
  const form = document.createElement("form");
  form.action = "/api/exam/zipexport/";
  form.method = "POST";
  form.target = "_blank";
  for (const filename of selectedExams) {
    const input = document.createElement("input");
    input.name = "filenames";
    input.value = filename;
    form.appendChild(input);
  }
  const csrf = document.createElement("input");
  csrf.name = "csrfmiddlewaretoken";
  csrf.value = getCookie("csrftoken") || "";
  form.appendChild(csrf);

  form.style.display = "none";
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

const badgeStyle = css`
  margin: 3px;
  font-size: 0.85rem !important;
`;

interface ExamTypeCardProps {
  examtype: string;
  exams: CategoryExam[];
  selected: Set<string>;
  onSelect: (...filenames: string[]) => void;
  onDeselect: (...filenames: string[]) => void;
  reload: () => void;
}
const ExamTypeCard: React.FC<ExamTypeCardProps> = ({
  examtype,
  exams,

  selected,
  onSelect,
  onDeselect,
  reload,
}) => {
  const user = useUser()!;
  const catAdmin = user.isCategoryAdmin;
  const history = useHistory();
  const allSelected = exams.every(exam => selected.has(exam.filename));
  const someSelected = exams.some(exam => selected.has(exam.filename));
  const checked = someSelected;
  const indeterminate = someSelected && !allSelected;
  const setChecked = (newValue: boolean) => {
    if (newValue) onSelect(...exams.map(exam => exam.filename));
    else onDeselect(...exams.map(exam => exam.filename));
  };
  return (
    <Card style={{ margin: "0.5em" }}>
      <CardHeader tag="h4">{examtype}</CardHeader>
      <div style={{ overflow: "scroll" }}>
        <Table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={checked}
                  ref={el => el && (el.indeterminate = indeterminate)}
                  onChange={e => setChecked(e.currentTarget.checked)}
                />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.map(exam => (
              <tr
                key={exam.filename}
                style={{ cursor: "pointer" }}
                onClick={() => history.push(`/exams/${exam.filename}`)}
              >
                <td
                  onClick={e => e.stopPropagation()}
                  style={{
                    cursor: "initial",
                    width: "1%",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(exam.filename)}
                    onChange={e =>
                      e.currentTarget.checked
                        ? onSelect(exam.filename)
                        : onDeselect(exam.filename)
                    }
                    disabled={!exam.canView}
                  />
                </td>
                <td>
                  <h6>
                    <TwoButtons
                      left={
                        exam.canView ? (
                          <Link to={`/exams/${exam.filename}`}>
                            {exam.displayname}
                          </Link>
                        ) : (
                          exam.displayname
                        )
                      }
                      right={
                        catAdmin && (
                          <ClaimButton exam={exam} reloadExams={reload} />
                        )
                      }
                    />
                  </h6>
                  {user.isAdmin && <Button close />}
                  <div>
                    {catAdmin && exam.public ? (
                      <Badge className={badgeStyle} color="primary">
                        public
                      </Badge>
                    ) : (
                      <Badge className={badgeStyle} color="primary">
                        hidden
                      </Badge>
                    )}
                    {exam.needs_payment && (
                      <Badge className={badgeStyle} color="info">
                        oral
                      </Badge>
                    )}
                    {exam.finished_cuts ? (
                      exam.finished_wiki_transfer ? (
                        <Badge className={badgeStyle} color="success">
                          All done
                        </Badge>
                      ) : (
                        <Badge className={badgeStyle} color="info">
                          Needs Wiki Import
                        </Badge>
                      )
                    ) : (
                      <Badge className={badgeStyle} color="warning">
                        Needs Cuts
                      </Badge>
                    )}

                    {exam.remark && (
                      <Badge className={badgeStyle} color="dark">
                        {exam.remark}
                      </Badge>
                    )}
                    {exam.is_printonly && (
                      <Badge
                        color="danger"
                        className={badgeStyle}
                        title="This exam can only be printed. We can not provide this exam online."
                      >
                        (Print Only)
                      </Badge>
                    )}
                    <Badge
                      color="secondary"
                      className={badgeStyle}
                      title={`There are ${exam.count_cuts} questions, of which ${exam.count_answered} have at least one solution.`}
                    >
                      {exam.count_answered} / {exam.count_cuts}
                    </Badge>
                    {exam.has_solution && (
                      <Badge title="Has an official solution." color="success">
                        Solution
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
};

interface ExamListProps {
  metaData: CategoryMetaData;
}
const ExamList: React.FC<ExamListProps> = ({ metaData }) => {
  const { data, loading, error, run: reload } = useRequest(() =>
    loadList(metaData.slug),
  );
  const examTypeMap = useMemo(
    () => (data ? mapExamsToExamType(data) : undefined),
    [data],
  );
  const [selected, onSelect, onDeselect] = useSet<string>();

  return (
    <>
      <Card style={{ margin: "0.5em" }}>
        <CardHeader>
          <Button
            disabled={selected.size === 0}
            onClick={() => dlSelectedExams(selected)}
          >
            Download selected exams
          </Button>
        </CardHeader>
      </Card>
      {error ? (
        <Alert color="danger">{error}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        examTypeMap &&
        examTypeMap.map(([examtype, exams]) => (
          <ExamTypeCard
            examtype={examtype}
            exams={exams}
            key={examtype}
            selected={selected}
            onSelect={onSelect}
            onDeselect={onDeselect}
            reload={reload}
          />
        ))
      )}
    </>
  );
};

interface CategoryPageContentProps {
  onMetaDataChange: (newMetaData: CategoryMetaData) => void;
  metaData: CategoryMetaData;
}
const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  onMetaDataChange,
  metaData,
}) => {
  const { data, loading } = useRequest(loadMetaCategories);
  const offeredIn = useMemo(
    () =>
      data ? getMetaCategoriesForCategory(data, metaData.slug) : undefined,
    [data, metaData],
  );
  const [editing, setEditing] = useState(false);
  const toggle = useCallback(() => setEditing(a => !a), []);
  const user = useUser()!;
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData.displayname}</BreadcrumbItem>
      </Breadcrumb>
      {editing ? (
        offeredIn && (
          <CategoryMetaDataEditor
            onMetaDataChange={onMetaDataChange}
            isOpen={editing}
            toggle={toggle}
            currentMetaData={metaData}
            offeredIn={offeredIn.flatMap(b =>
              b.meta2.map(d => [b.displayname, d.displayname] as const),
            )}
          />
        )
      ) : (
        <>
          {user.isCategoryAdmin && (
            <IconButton close icon="EDIT" onClick={() => setEditing(true)} />
          )}
          <h1>{metaData.displayname}</h1>
          <ListGroup style={{ marginBottom: "2em" }}>
            {metaData.semester && (
              <ListGroupItem>
                Semester: <Badge>{metaData.semester}</Badge>
              </ListGroupItem>
            )}
            {metaData.form && (
              <ListGroupItem>
                Form: <Badge>{metaData.form}</Badge>
              </ListGroupItem>
            )}
            {(offeredIn === undefined || offeredIn.length > 0) && (
              <ListGroupItem>
                Offered in:
                <div>
                  {loading ? (
                    <Spinner />
                  ) : (
                    <ul>
                      {offeredIn?.map(meta1 =>
                        meta1.meta2.map(meta2 => (
                          <li key={meta1.displayname + meta2.displayname}>
                            {meta2.displayname} in {meta1.displayname}
                          </li>
                        )),
                      )}
                    </ul>
                  )}
                </div>
              </ListGroupItem>
            )}
            {metaData.more_exams_link && (
              <ListGroupItem>
                <a
                  href={metaData.more_exams_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Additional Exams
                </a>
              </ListGroupItem>
            )}
            {metaData.remark && (
              <ListGroupItem>Remark: {metaData.remark}</ListGroupItem>
            )}
            {metaData.experts.includes(user.username) && (
              <ListGroupItem>
                You are an expert for this category. You can endorse correct
                answers.
              </ListGroupItem>
            )}
            {metaData.has_payments && (
              <ListGroupItem>
                You have to pay a deposit of 20 CHF in the VIS bureau in order
                to see oral exams.
                <br />
                After submitting a report of your own oral exam you can get your
                deposit back.
              </ListGroupItem>
            )}
            {metaData.catadmin && (
              <ListGroupItem>
                You can edit exams in this category. Please do so responsibly.
              </ListGroupItem>
            )}
          </ListGroup>
          <ExamList metaData={metaData} />
          {metaData.attachments.length > 0 && (
            <>
              <h2>Attachments</h2>
              <ListGroup flush>
                {metaData.attachments.map(att => (
                  <a
                    href={"/api/filestore/get/" + att.filename + "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={att.filename}
                  >
                    <ListGroupItem>{att.displayname}</ListGroupItem>
                  </a>
                ))}
              </ListGroup>
            </>
          )}
        </>
      )}
    </>
  );
};

const CategoryPage: React.FC<{}> = () => {
  const { slug } = useParams() as { slug: string };
  const { data, loading, error, mutate } = useRequest(() =>
    loadCategoryMetaData(slug),
  );
  const user = useUser();
  return (
    <Container>
      {error ? (
        <Alert color="danger">{error.message}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        data && (
          <UserContext.Provider
            value={
              user
                ? {
                    ...user,
                    isCategoryAdmin: user.isCategoryAdmin || data.catadmin,
                  }
                : undefined
            }
          >
            <CategoryPageContent metaData={data} onMetaDataChange={mutate} />
          </UserContext.Provider>
        )
      )}
    </Container>
  );
};
export default CategoryPage;
