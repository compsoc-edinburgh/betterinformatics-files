# Changelog

All changes to this project are documented in this file.

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
