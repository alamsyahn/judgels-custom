# AGENTS.md

## Canonical repository

The canonical repository for this customized Judgels installation is:

`https://github.com/alamsyahn/judgels-custom`

Remote policy:

- `origin` = this customized repository
- `upstream` = `https://github.com/ia-toki/judgels.git`
- production branch = `custom-course-ui`

This repository, not the upstream Judgels repository, is the source of truth
for the deployed frontend.

When investigating or modifying this installation, always inspect the current
`origin/custom-course-ui` branch first.

Use `upstream` only to research official Judgels code or selectively backport
changes.

## Scope

This repository contains a customized Judgels frontend used in production.

Primary repository path on the VPS:

`/root/judgels-custom`

Primary branch:

`custom-course-ui`

Production baseline revision:

`b84852e7b9c46127e1cacffbae774af721a8927b`

The official image is tagged `ghcr.io/ia-toki/judgels/client:2.23.0`, but the image label points to the baseline revision above, which is newer than the `v2.23.0` tag. Use the production baseline revision, not the tag, when comparing source.

## Non-negotiable safety rules

- Do not edit minified/static files inside the running production container.
- Do not modify Judgels server, grader, database, RabbitMQ, or problem data for frontend-only requests.
- Do not upgrade dependencies or Judgels versions unless explicitly requested.
- Do not wholesale-copy current `master` files into this branch. Newer Judgels has significant course/API refactors; backport only the minimal required behavior.
- Keep changes small and atomic. Prefer one concern per commit.
- Before every build, run `git diff --check`.
- Before every production deployment, build and test a separate client container first.
- Never delete the production-backup container until the custom production version has been verified.
- Preserve the existing course/problem submission API payload. Source code should ultimately be submitted through `sourceFiles`.
- For frontend work, avoid touching `/opt/judgels` except the existing runtime config mount used by the production client.

## Current production architecture

Public frontend:

`https://judgels.alamsyahn.com`

Traffic flow:

`Browser -> Caddy -> host :5000 -> container judgels-client`

Production client runtime config on the host:

`/opt/judgels/client/var/conf/judgels-client.js`

Mounted inside the client container as:

`/judgels/client/var`

Production API:

`https://api.judgels.alamsyahn.com/v2`

Relevant containers include `judgels-client`, `judgels-server`, `judgels-grader`, and `rabbitmq`. The custom work in this repository is frontend-only unless explicitly stated otherwise.

## Current UI customizations

### Course problems

Course problems are no longer split-screen.

Desired structure:

1. Course navigation / progress.
2. Problem statement.
3. `Code | Submissions` tabs.
4. Submission editor below the statement.

The course content container is centered and constrained to approximately the same main-content width as the Problemset view (`865px`).

The Course statement uses the same title and limits rendering as Problemset:

- problem title is visible;
- time limit is visible;
- memory limit is visible.

Do not reintroduce the old inline Course limits header.

### Course submission editor

The Course editor uses the existing Ace editor and remains below the statement.

It supports paste/type source code, optional source file upload, language selection, Submit, existing submission result polling/summary, and existing reset behavior where applicable.

If both editor text and an uploaded file are present, the uploaded file takes precedence.

The backend submission format remains `sourceFiles`.

### Problemset submission form

For normal single-source-code programming problems, Problemset submission also supports an Ace editor for paste/type plus the original optional source file upload, language selection, and Submit.

For output-only or multi-source problems, preserve the original upload-oriented behavior unless explicitly asked to change it.

## Important source files

Course layout:

`judgels-client/src/routes/courses/courses/single/chapters/single/problems/single/Programming/ChapterProblemPage.scss`

Course statement:

`judgels-client/src/routes/courses/courses/single/chapters/single/problems/single/Programming/ChapterProblemStatementPage/ChapterProblemStatementPage.jsx`

`judgels-client/src/routes/courses/courses/single/chapters/single/problems/single/Programming/ChapterProblemStatementPage/ChapterProblemStatementPage.scss`

Course submission editor:

`judgels-client/src/components/ProblemWorksheetCard/Programming/ProblemSubmissionEditor/ProblemSubmissionEditor.jsx`

`judgels-client/src/components/ProblemWorksheetCard/Programming/ProblemSubmissionEditor/ProblemSubmissionEditor.scss`

Problemset submission form:

`judgels-client/src/components/ProblemWorksheetCard/Programming/ProblemSubmissionForm/ProblemSubmissionForm.jsx`

`judgels-client/src/components/ProblemWorksheetCard/Programming/ProblemSubmissionForm/ProblemSubmissionForm.scss`

Shared editor:

`judgels-client/src/components/forms/FormAceEditor/FormAceEditor.jsx`

Shared worksheet:

`judgels-client/src/components/ProblemWorksheetCard/Programming/ProblemWorksheetCard.jsx`

## Known implementation details / gotchas

### Ace editor

`FormAceEditor` uses `height="100%"`. A vertical page therefore needs an explicit parent/container height. The current custom vertical editor uses roughly `420px`.

### Optional uploaded file validation

In Judgels 2.23.0, `MaxFileSize300KB` treats an empty value as invalid. If a file field is optional because editor text is allowed, wrap this validator so an empty file returns `undefined` before applying file-size/extension validation.

### Submission behavior

The existing Course editor converts editor text into a browser `File` using `getGradingLanguageEditorSubmissionFilename()` and sends it through `sourceFiles`.

Preserve this behavior. Do not invent a new backend payload for this branch unless server support is explicitly added.

### Browser cache

`judgels-client.js` can be cached. When runtime config or bundles are changed during testing, use Chrome DevTools with Disable cache + Empty Cache and Hard Reload.

### Local preview / CORS

Opening the custom frontend directly at `http://localhost:5001` while it points to the production API fails CORS because the production API allows the production frontend origin, not localhost.

For local preview, use the dedicated test config and nginx proxy so the browser sees a same-origin API path.

Test runtime config:

`/root/judgels-client-test-var/conf/judgels-client.js`

For test only, it can use:

`apiUrl: '/api/v2'`

Test nginx config:

`/root/judgels-client-test.conf`

The test nginx proxies `/api/` to `https://api.judgels.alamsyahn.com/`.

Do not copy this test `apiUrl` into production.

### Newer Judgels master

Newer Judgels already has a paste editor in `ProblemSubmissionForm`, but newer master also substantially restructures Course layouts, routes, APIs, and submission actions.

Use newer master only as a reference implementation. Do not cherry-pick broad Course changes into this 2.23.0-based branch without explicit review.

## Build procedure

Do not rely on the VPS host Node installation. Build using the known-good Node 20 container and Yarn 1.22.22 bundled in that image:

```bash
cd /root/judgels-custom

docker run --rm \
  -v /root/judgels-custom/judgels-client:/app \
  -v /app/node_modules \
  -w /app \
  node:20-bookworm \
  bash -lc '
    set -e
    export NODE_OPTIONS="--max-old-space-size=4096"
    yarn install --frozen-lockfile
    yarn build
  '
```

Expected result:

`Compiled successfully.`

Build output:

`/root/judgels-custom/judgels-client/build`

## Build custom Docker image

Use a separate image context so generated build files do not dirty the Git repository:

```bash
rm -rf /root/judgels-client-image-context
mkdir -p /root/judgels-client-image-context

cp /root/judgels-custom/judgels-client/dist/Dockerfile \
   /root/judgels-client-image-context/

cp /root/judgels-custom/judgels-client/dist/judgels-client.conf \
   /root/judgels-client-image-context/

cp -a /root/judgels-custom/judgels-client/build \
   /root/judgels-client-image-context/

cd /root/judgels-custom

docker build \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  -t judgels-client-custom:2.23.0 \
  /root/judgels-client-image-context
```

## Test deployment

Never replace production before a test container works.

```bash
docker rm -f judgels-client-test 2>/dev/null || true

docker run -d \
  --name judgels-client-test \
  --restart=no \
  -p 127.0.0.1:5001:5000 \
  -v /root/judgels-client-test-var:/judgels/client/var \
  -v /root/judgels-client-test.conf:/etc/nginx/conf.d/default.conf:ro \
  judgels-client-custom:2.23.0
```

Basic checks:

```bash
curl -I http://127.0.0.1:5001
docker logs judgels-client-test
```

For local browser access, use an SSH tunnel from the developer machine:

```bash
ssh -L 5001:127.0.0.1:5001 root@<VPS_IP>
```

Then open `http://localhost:5001`.

## Test checklist before production

At minimum verify:

- Course statement width/layout is correct.
- Course title appears.
- Course time and memory limits appear.
- Course Prev/Next still works.
- Course `Code | Submissions` tabs still work.
- Course editor accepts pasted code.
- Course optional upload works.
- Course pasted-code submission reaches a final verdict.
- Problemset editor appears for a normal single-source problem.
- Problemset pasted-code submission reaches a final verdict.
- Problemset file upload still works.
- Output-only / multi-source problems are not accidentally changed.
- Dark mode and light mode remain usable.
- No obvious browser console errors.
- `git diff --check` is clean.

## Production deployment

Production must use the real production runtime config mount:

`/opt/judgels/client/var:/judgels/client/var`

Do not use the localhost test config.

Safe deployment pattern:

```bash
docker tag \
  judgels-client-custom:2.23.0 \
  judgels-client-custom:2.23.0-course-ui

docker stop judgels-client

docker rename \
  judgels-client \
  judgels-client-original-backup

docker run -d \
  --name judgels-client \
  --restart=on-failure \
  -p 0.0.0.0:5000:5000 \
  -v /opt/judgels/client/var:/judgels/client/var \
  judgels-client-custom:2.23.0-course-ui
```

Then verify:

```bash
docker ps --filter name=judgels-client
docker logs --tail=50 judgels-client
curl -I http://127.0.0.1:5000
curl -s http://127.0.0.1:5000/var/conf/judgels-client.js
curl -I https://judgels.alamsyahn.com
```

Production runtime config must still point to `https://api.judgels.alamsyahn.com/v2`.

## Rollback

If production has a frontend problem:

```bash
docker rm -f judgels-client

docker rename \
  judgels-client-original-backup \
  judgels-client

docker start judgels-client
```

Verify:

```bash
curl -I http://127.0.0.1:5000
curl -I https://judgels.alamsyahn.com
```

Do not delete `judgels-client-original-backup` until the new frontend has been proven stable.

## Git history

Important known commits on `custom-course-ui` include:

- `e753c1a` — Make course problem layout vertical
- `6136ddd` — Add file upload to vertical course submission editor
- `93f2241` — Constrain course problem content width
- `6fa7e84` — Add paste editor to problemset submission form

There is also a later final UI adjustment that matches the Course statement more closely to Problemset (`865px` width and Problemset-style title/limits). Use current `HEAD` as the source of truth and inspect `git log` for its exact commit hash.

## When modifying again

Before coding:

```bash
cd /root/judgels-custom
git status
git log --oneline -10
```

Create a new branch from the current working production branch when the change is non-trivial.

After coding:

```bash
git diff --check
git diff
```

Build, run the test container, visually verify, test real submissions, then deploy.
