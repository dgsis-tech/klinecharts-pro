#!/usr/bin/env bash
# Runs on the host before the container is created (and manually from the README).
# Ensures .dev/.env, the Docker network go-dev, and the shared image klp-chart-dev:latest.

set -euo pipefail

# Must match .devcontainer/devcontainer.json (image + runArgs).
EXPECTED_NETWORK="go-dev"
EXPECTED_IMAGE="klp-chart-dev:latest"

REBUILD=0
for arg in "$@"; do
    case "$arg" in
        --rebuild|-r) REBUILD=1 ;;
        -h|--help)
            cat <<'EOF'
Usage: bash .dev/init-host.sh [--rebuild]

Ensures:
  - .dev/.env exists (copied from .env.example if missing)
  - Docker network go-dev exists
  - Docker image klp-chart-dev:latest exists

DOCKER_NETWORK / DOCKER_IMAGE in .dev/.env must be go-dev / klp-chart-dev:latest
(same contract as .devcontainer/devcontainer.json).

Options:
  --rebuild, -r   Force rebuild of the image
EOF
            exit 0
            ;;
        *)
            echo "Unknown option: $arg (try --help)" >&2
            exit 1
            ;;
    esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEV_DIR="${ROOT}/.dev"
DC_DIR="${ROOT}/.devcontainer"
ENV_FILE="${DEV_DIR}/.env"
ENV_EXAMPLE="${DEV_DIR}/.env.example"
DOCKERFILE="${DC_DIR}/Dockerfile"

mkdir -p "${DEV_DIR}/secrets"

# Migrate legacy root .env → .dev/.env (one-time)
if [[ -f "${ROOT}/.env" && ! -f "${ENV_FILE}" ]]; then
    mv "${ROOT}/.env" "${ENV_FILE}"
    echo "Moved .env → .dev/.env"
fi

if [[ ! -f "${ENV_FILE}" ]]; then
    if [[ ! -f "${ENV_EXAMPLE}" ]]; then
        echo "Missing ${ENV_EXAMPLE}" >&2
        exit 1
    fi
    cp "${ENV_EXAMPLE}" "${ENV_FILE}"
    echo "Created .dev/.env from .dev/.env.example — edit GIT_*/SSH_*/GITHUB_TOKEN as needed."
fi

# shellcheck disable=SC1091
set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

# Compat: .env antiguos usaban go_dev / DOCKER_IMAGE_NAME
if [[ "${DOCKER_NETWORK:-}" == "go_dev" ]]; then
    echo "⚠ DOCKER_NETWORK=go_dev está obsoleto; usando ${EXPECTED_NETWORK}"
    DOCKER_NETWORK="${EXPECTED_NETWORK}"
fi
if [[ -z "${DOCKER_IMAGE:-}" && -n "${DOCKER_IMAGE_NAME:-}" ]]; then
    DOCKER_IMAGE="${DOCKER_IMAGE_NAME}:latest"
fi

NETWORK="${DOCKER_NETWORK:-${EXPECTED_NETWORK}}"
IMAGE="${DOCKER_IMAGE:-${EXPECTED_IMAGE}}"

if [[ "$NETWORK" != "$EXPECTED_NETWORK" || "$IMAGE" != "$EXPECTED_IMAGE" ]]; then
    echo "Error: DOCKER_NETWORK/DOCKER_IMAGE deben coincidir con devcontainer.json:" >&2
    echo "  esperado: DOCKER_NETWORK=${EXPECTED_NETWORK}  DOCKER_IMAGE=${EXPECTED_IMAGE}" >&2
    echo "  en .env: DOCKER_NETWORK=${NETWORK}  DOCKER_IMAGE=${IMAGE}" >&2
    echo "Corrige .dev/.env (devcontainer.json no puede leer ese archivo)." >&2
    exit 1
fi

if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    docker network create "$NETWORK"
    echo "Created Docker network: $NETWORK"
else
    echo "Docker network ok: $NETWORK"
fi

if docker network inspect go_dev >/dev/null 2>&1; then
    echo "ℹ Existe también la red legacy go_dev; puedes borrarla si no la usas: docker network rm go_dev"
fi

if [[ ! -f "$DOCKERFILE" ]]; then
    echo "Missing Dockerfile: $DOCKERFILE" >&2
    exit 1
fi

if [[ "$REBUILD" -eq 1 ]] || ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    if [[ "$REBUILD" -eq 1 ]]; then
        echo "Rebuilding Docker image: $IMAGE"
    else
        echo "Building Docker image: $IMAGE"
    fi
    docker build -t "$IMAGE" -f "$DOCKERFILE" "${DC_DIR}"
    echo "Docker image ready: $IMAGE"
else
    echo "Docker image ok: $IMAGE"
fi
