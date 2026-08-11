# Judgels Customization Notes

## Purpose

This document records the operational context behind the customized Judgels frontend so future changes do not require rediscovering the deployment architecture.

The customizations were introduced because the default Course programming-problem page used a split-screen layout: statement on the left and code editor on the right. The desired experience is closer to the Problemset page: readable centered statement first, then submission controls below it.

## Production baseline

Repository: `/root/judgels-custom`

Branch: `custom-course-ui`

Baseline revision matching the production image label:

`b84852e7b9c46127e1cacffbae774af721a8927b`

Official production image that existed before customization:

`ghcr.io/ia-toki/judgels/client:2.23.0`

A backup tag was also created during the customization work:

`judgels-client-original:2.23.0`

The original image ID observed during the work was `ebbc394858f3`.

The production image revision differed from the `v2.23.0` Git tag. All custom work was intentionally based on the actual image revision.

## Deployment architecture discovered

Judgels runs in Docker. The frontend container serves nginx on container port `5000` and is exposed on host port `5000`.

Caddy handles HTTPS and proxies:

`judgels.alamsyahn.com -> host :5000`

The production client runtime config is stored outside the image at:

`/opt/judgels/client/var/conf/judgels-client.js`

It is mounted into the container at `/judgels/client/var`.

The API is `https://api.judgels.alamsyahn.com/v2`.

The server, grader, RabbitMQ, and database were not modified as part of the frontend customization.

## Why source had to be cloned

`/opt/judgels/client` did not contain React source or built static assets. It only contained the runtime `var/conf` directory.

The live frontend came from the Docker image, so source was cloned separately to `/root/judgels-custom`. Editing the running container or minified bundles was deliberately avoided.

## Current UX

### Course

Before: `statement | code editor`

After:

- centered statement;
- approximately Problemset main-content width (`865px`);
- visible problem title;
- visible time limit;
- visible memory limit;
- Course navigation remains;
- `Code | Submissions` remains;
- submission editor appears below the statement.

### Problemset

Problemset keeps its existing layout, but normal single-source programming problems now also offer an Ace editor above the upload form.

### Submission rules

For Course, editor text is converted into a `File`, optional upload is supported, upload wins if both are present, and the existing `sourceFiles` backend format is preserved.

For Problemset single-source problems, editor text can be submitted and file upload remains available. Output-only / multi-source behavior should remain conservative and close to upstream 2.23.0.

## Why not simply use latest Judgels master

Newer master contains useful reference code for a paste editor, but it also significantly refactors Course layouts, routes, submissions, APIs, and action modules.

The safer strategy for this installation is minimal backporting rather than wholesale replacement.

## Local test environment

A custom image is tested separately on `127.0.0.1:5001`.

Because the production API CORS configuration accepts the real production frontend origin but not `http://localhost:5001`, a special local-test runtime config and nginx proxy were used.

Test runtime config:

`/root/judgels-client-test-var/conf/judgels-client.js`

Test-only API value:

`apiUrl: '/api/v2'`

Test nginx config:

`/root/judgels-client-test.conf`

That nginx config proxies `/api/` to the real production API.

The test setup must never replace the production runtime config.

## Browser caching issue found during testing

Chrome initially continued calling the production API directly even after the test config changed to `/api/v2`.

The server was serving the correct new config, but the browser still had the previous runtime config cached.

Fix: use DevTools with Disable cache and Empty Cache and Hard Reload, or use a fresh Incognito window.

## Build environment

The VPS host itself had Node 22, but the custom frontend was successfully built using `node:20-bookworm`, Node `v20.20.2`, and Yarn `1.22.22`.

The official Node image already contained Yarn 1.22.22. Attempting `npm install -g yarn@1.22.22` caused `EEXIST`, so do not reinstall Yarn inside that image.

## Validation detail that mattered

`MaxFileSize300KB` in this Judgels version does not treat an empty value as valid.

Therefore an optional upload field needs a wrapper validator: if no file is selected, return `undefined`; otherwise apply file-size and extension validation.

Without this wrapper, paste-code-only submission can be blocked by the optional upload field.

## Important commits

Known commits created during the customization:

- `e753c1a` — vertical Course problem layout
- `6136ddd` — Course file-upload support in vertical editor
- `93f2241` — constrain Course content width
- `6fa7e84` — paste editor in Problemset submission form

A later commit finalized the Problemset-style Course statement: approximately `865px` width with visible title/time/memory. Use current branch `HEAD` and `git log` for the exact hash.

## Recommended workflow for future UI changes

Use the repository as the single source of truth. Do not make ad-hoc changes in the live container.

Recommended cycle:

`new branch -> minimal edits -> git diff --check -> build -> test container :5001 -> visual + real submission tests -> commit/tag -> production client swap -> health checks`

For larger changes, keep a short design note in `docs/` before implementing so future agents understand the intended behavior, not just the code.
