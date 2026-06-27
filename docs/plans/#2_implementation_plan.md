# Implementation Plan - LLM Reachability and Error Handling Improvements

We will enhance the backend's environment variable loading and LLM connection fallback, and improve the client's error-handling interface to make local debugging easier.

## Proposed Changes

### Backend LLM Connection & Environment Loading

We will update the backend to load the `.env` file dynamically and automatically resolve the correct Docker Model Runner endpoints inside and outside the Docker container.

#### [MODIFY] [nodes.py](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/backend/agent/nodes.py)
- Import `dotenv` and call `load_dotenv(find_dotenv())` to support local development outside of Docker Compose.
- Dynamically detect container execution by checking if the container filesystem or `/workspace` mount point exists.
- Clean up the legacy `model-runner:8000/v1` fallback. Set the default fallback `LLM_BASE_URL` to `http://model-runner.docker.internal` when in Docker, and `http://localhost:12434` when running on the host machine.
- Automatically construct `LLM_MODEL_NAME` using the `docker.io/` registry prefix if it is not explicitly passed.

---

### Client Error Handlers

We will update the frontend's API catch block to distinguish between network failures and backend API 500 exceptions, displaying specific error messages rather than a generic connection failure prompt.

#### [MODIFY] [App.tsx](file:///c:/AppDev/My_Linkdin/projects/iarxii/AIDock/client/src/App.tsx)
- Check `res.ok` status on response and parse the JSON error body (`res.json()`) to retrieve detailed error messages from FastAPI.
- Render specific error messages in the chat stream so the developer/user immediately knows what failed (e.g. model runner timeout, missing model, database error).

## Verification Plan

### Automated/Manual Verification
- Restart the Docker Compose stack using `.\aidock.bat start` to verify that the chat executes correctly.
- Test endpoint failure scenario by temporarily disabling Docker Model Runner or configuring a non-existent model, then verifying that the frontend UI displays the exact error details returned by the FastAPI backend instead of the generic connection error.
