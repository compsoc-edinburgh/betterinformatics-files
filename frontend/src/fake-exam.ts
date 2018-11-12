import {Section, SectionKind} from "./interfaces";

export const SECTIONS: Section[] = [
  {
    key: -1,
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.0,
    },
    end: {
      page: 1,
      position: 0.2,
    },
  },
  {
    oid: "123",
    kind: SectionKind.Answer,
    asker: "testusera",
    allow_new_answer: true,
    answers: [
      {
        authorId: "testusera",
        canEdit: false,
        text: "test answer A",
        comments: [
          {
            text: "test comment A.1",
            authorId: "testusera",
            time: "2018-04-20T13:03:04.875000",
            oid: "5ad9e50818ade5108bcc31b4",
          },
          {
            text: "test comment A.2",
            authorId: "testusera",
            time: "2018-04-20T13:03:11.767000",
            oid: "5ad9e50f18ade5108bcc31b5",
          },
        ],
        upvotes: ["testusera"],
        time: "2018-04-20T13:02:59.255000",
        oid: "5ad9e50318ade5108bcc31b3",
      },
      {
        authorId: "testusera",
        canEdit: false,
        text: "test answer B",
        comments: [
          {
            text: "test comment B.1",
            authorId: "testusera",
            time: "2018-04-20T13:03:22.129000",
            oid: "5ad9e51a18ade5108bcc31b7",
          },
        ],
        upvotes: [],
        time: "2018-04-20T13:03:17.555000",
        oid: "5ad9e51518ade5108bcc31b6",
      },
    ],
  },
  {
    key: 1,
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.2,
    },
    end: {
      page: 1,
      position: 0.5,
    },
  },
  {
    oid: "1234",
    kind: SectionKind.Answer,
    asker: "testuserb",
    allow_new_answer: true,
    answers: [
      {
        authorId: "testuserb",
        canEdit: false,
        text: "test answer C",
        comments: [
          {
            text: "test comment C.1",
            authorId: "testusera",
            time: "2018-04-20T13:03:04.875000",
            oid: "5ad9e50818ade5108bcc31b4",
          },
        ],
        upvotes: ["testuserb"],
        time: "2018-04-20T13:02:59.255000",
        oid: "5ad9e50318ade5108bcc31b3",
      },
    ],
  },
  {
    key: 3,
    kind: SectionKind.Pdf,
    start: {
      page: 1,
      position: 0.5,
    },
    end: {
      page: 1,
      position: 1,
    },
  },
];
