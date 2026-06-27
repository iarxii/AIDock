# Implementation Plan - Fixing AIDock Build and Improving CLI Orchestration

We will resolve the client build failure, improve CLI error handling, dynamic link sharing, and document the Docker Model Runner requirement.

## Proposed Changes

### Client Build Configuration
We will add `tsconfig.json` to the `client` directory to support TypeScript compilation and define a custom `nginx.conf` to proxy `/api/*` requests to the backend.

#### [NEW] [tsconfig.json](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/tsconfig.json)
- Create client-specific TypeScript configuration so `tsc -b` succeeds.

#### [NEW] [nginx.conf](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/nginx.conf)
- Route frontend `/api/*` calls to the `backend:8080` container.

#### [MODIFY] [Dockerfile](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/Dockerfile)
- Copy the custom `nginx.conf` to `/etc/nginx/conf.d/default.conf` in the nginx production container.

---

### CLI Orchestration and Error Handling
We will update `cli/aidock.py` to check the success of `docker compose up -d` and query container port mappings dynamically rather than hardcoding `http://localhost:3000`.

#### [MODIFY] [aidock.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/cli/aidock.py)
- Catch non-zero exit codes from `docker compose`.
- Programmatically resolve the host-mapped ports for the client and backend.
- Print status checks and dynamic URLs.

---

### Documentation Update
We will document the requirement to enable Docker Model Runner in Docker Desktop settings before running the workflow.

#### [MODIFY] [README.md](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/README.md)
- Add clear instructions with screenshots reference or settings path to enable Docker Model Runner.

#### [MODIFY] [architecture.md](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/docs/architecture.md)
- Add a Prerequisites section explaining the role of Docker Model Runner.

## Verification Plan

### Automated/Manual Verification
- Run `.\aidock.bat start` to verify that the build completes successfully and the correct dynamic links are printed.
- Verify container logs and that client connects to the backend successfully.
