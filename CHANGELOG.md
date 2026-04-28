# Changelog

All changes to this project are documented in this file.

## v2026.04.edi0 (Based on upstream v2026.04.p0)

- Merged all changes from upstream up to v2026.04.p0. See below for changelog  (#86).

## v2026.04.p0 - Coding Weekend!

### Added

- "What's New" page (!643)
- Display recently viewed exams on homepage (!668)
- Mark exams as 'Solved' for your own study (!669)
- Score percentiles in user profile page (!518)
- Marking answers as AI-generated for transparency (!626)
- Frontend support for embedding PDFs in markdown (!633)
- Page number input for long PDFs (!493)
- Admins can now reply to feedbacks by users (!661)
- More intelligent file extension renders for documents (!445)
- Delete exam button in modqueue (!652)
- Support for setting homeorg to something other than ethz.ch (!639)
- Support for .xlsx, .csv, .ods document formats (!628)

### Changed

- Upgrade Yarn from v1 to v4 (!636, !654)
- Upgrade react-router from v6 to v7 (!635)
- Upgrade UI library (Mantine) from v8 to v9 (!658)
- Upgrade dependencies: vite (!620), typescript (!631), pdfjs (!632), react-syntax-highlighter (!670), faro-react (!666)
- Rewrote Images API to be OpenAPI-compliant (!656)

### Fixed

- Annoying layout shift when cutting exams (!641)
- Pinch-zoom not working on mobile modals (!659)
- Syntax highlighting broken (!660)
- Tons of requests firing off in home page (!664)
- Overflowing text editor icons on mobile (!647)
- Various frontend linter warnings (!629, !630, !673)

Many thanks to contributors Luca, Yuto, Burak, Severin, Marius, Jacques, Metehan, Bogdan, Clemens, and Emily.

## v2026.03.p0

### Added

- Support for Typst files when uploading documents (!618)
- Auto-generated API documentation using Django Ninja (!614)
- Mermaid explanations in supported functions (!617)
- Backend support for official answers in exams (!429)
- Caching parts of the home page improving load times (!545)

### Changed

- Migrated Node LTS to v24 (!619)
- Migrated React Router to v6 (!579)
- Migrated ahooks to v2 (!615)

### Fixed

- Auth token flagged as expired before expiry time due to timezone offset handling (!612)
- Cannot select text from the source code of supported markdown functions (!616)
- List meta categories getting called separately for each meta category (!623)
- Failing to use refresh token due to not passing the scope variable to Keycloak (!624)

## Previous Changes

The changes before this point were not tagged and don't have a changelog. Check the commit history for more information.
