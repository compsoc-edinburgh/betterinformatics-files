import { useRequest } from "@umijs/hooks";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardHeader,
  Container,
  ListGroup,
  ListGroupItem,
  Spinner,
  Table,
} from "@vseth/components";
import { BreadcrumbItem } from "@vseth/components/dist/components/Breadcrumb/Breadcrumb";
import React, { useMemo } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { getMetaCategoriesForCategory } from "../category-utils";
import { fetchapi } from "../fetch-utils";
import { CategoryExam, CategoryMetaData, MetaCategory } from "../interfaces";

const loadCategoryMetaData = async (slug: string) => {
  return (await fetchapi(`/api/category/metadata?slug=${slug}`))
    .value as CategoryMetaData;
};
const loadMetaCategories = async () => {
  return (await fetchapi("/api/listmetacategories")).value as MetaCategory[];
};
const loadList = async (slug: string) => {
  return (await fetchapi(`/api/category/list?slug=${slug}`))
    .value as CategoryExam[];
};
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

interface ExamTypeCardProps {
  examtype: string;
  exams: CategoryExam[];
}
const ExamTypeCard: React.FC<ExamTypeCardProps> = ({ examtype, exams }) => {
  const history = useHistory();
  return (
    <Card>
      <CardHeader tag="h4">{examtype}</CardHeader>
      <Table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" />
            </th>
            <th>Name</th>
            <th>Remark</th>
            <th>Answers</th>
          </tr>
        </thead>
        <tbody>
          {exams.map(exam => (
            <tr
              key={exam.filename}
              style={{ cursor: "pointer" }}
              onClick={() => history.push(`/exams/${exam.filename}`)}
            >
              <td>
                <input type="checkbox" />
              </td>
              <td>
                <Link to={`/exams/${exam.filename}`}>{exam.displayname}</Link>
              </td>
              <td>{exam.remark}</td>
              <td>
                {exam.count_cuts} / {exam.count_cuts}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
};

interface ExamListProps {
  metaData: CategoryMetaData;
}
const ExamList: React.FC<ExamListProps> = ({ metaData }) => {
  const { data, loading, error } = useRequest(() => loadList(metaData.slug));
  const examTypeMap = useMemo(
    () => (data ? mapExamsToExamType(data) : undefined),
    [data],
  );
  return (
    <>
      {error ? (
        <Alert color="danger">{error}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        examTypeMap &&
        examTypeMap.map(([examtype, exams]) => (
          <ExamTypeCard examtype={examtype} exams={exams} key={examtype} />
        ))
      )}
    </>
  );
};

interface CategoryPageContentProps {
  metaData: CategoryMetaData;
}
const CategoryPageContent: React.FC<CategoryPageContentProps> = ({
  metaData,
}) => {
  const { data, loading } = useRequest(loadMetaCategories);
  const offeredIn = useMemo(
    () =>
      data ? getMetaCategoriesForCategory(data, metaData.category) : undefined,
    [data, metaData],
  );
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbItem>{metaData.category}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{metaData.category}</h1>
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
      </ListGroup>
      <ExamList metaData={metaData} />
    </>
  );
};

const CategoryPage: React.FC<{}> = () => {
  const { slug } = useParams() as { slug: string };
  const { data, loading, error } = useRequest(() => loadCategoryMetaData(slug));
  return (
    <Container>
      {error ? (
        <Alert color="danger">{error.message}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        data && <CategoryPageContent metaData={data} />
      )}
    </Container>
  );
};
export default CategoryPage;
