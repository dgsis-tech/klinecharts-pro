#!/usr/bin/env bash
# Configura el contenedor al arrancar: zsh, git, ssh y gh según .env

set -euo pipefail

DEV_DIR="${DEV_DIR:-/workspaces/.dev}"
ROOT_DIR="${ROOT_DIR:-${HOME:-/root}}"
ENV_FILE="${ENV_FILE:-/workspaces/.dev/.env}"
WORKSPACE="${WORKSPACE:-/workspaces}"

load_env() {
    if [[ ! -f "${ENV_FILE}" ]]; then
        echo "  ⚠ No hay ${ENV_FILE} — copia .dev/.env.example a .dev/.env"
        return 0
    fi
    # Exporta variables sin ejecutar el archivo como script
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
}

resolve_path() {
    local path="$1"
    if [[ -z "${path}" ]]; then
        echo ""
        return
    fi
    if [[ "${path}" = /* ]]; then
        echo "${path}"
    else
        echo "${WORKSPACE}/${path}"
    fi
}

write_shell_env() {
    local dest="${ROOT_DIR}/.zsh-env"
    {
        echo "# Generado por setup-dev.sh — no editar a mano"
        if [[ -n "${GITHUB_TOKEN:-}" ]]; then
            echo "export GITHUB_TOKEN=\"${GITHUB_TOKEN}\""
        fi
        if [[ -n "${NPM_TOKEN:-}" ]]; then
            echo "export NPM_TOKEN=\"${NPM_TOKEN}\""
        fi
    } > "${dest}"
    chmod 600 "${dest}"
}

setup_zsh() {
    if ! compgen -G "${DEV_DIR}/.zsh*" > /dev/null; then
        echo "  ⚠ No se encontraron archivos .zsh* en ${DEV_DIR}"
        return 1
    fi

    # No copiar generados ni legados con secretos (.zsh-local sí: es override personal gitignored)
    local f
    for f in "${DEV_DIR}"/.zsh*; do
        case "$(basename "${f}")" in
            .zsh-ydg|.zsh-env) continue ;;
        esac
        cp "${f}" "${ROOT_DIR}/"
    done

    write_shell_env
    echo "  ✓ Configuración zsh copiada"
}

setup_ssh() {
    local key_file pub_file host
    key_file="$(resolve_path "${SSH_KEY_FILE:-}")"
    pub_file="$(resolve_path "${SSH_KEY_PUB_FILE:-}")"
    host="${SSH_HOST:-github.com}"

    if [[ -z "${key_file}" ]]; then
        echo "  ↷ SSH omitido (SSH_KEY_FILE vacío)"
        return 0
    fi

    if [[ ! -f "${key_file}" ]]; then
        echo "  ⚠ Clave SSH no encontrada: ${key_file}"
        return 0
    fi

    echo "Configurando SSH..."
    mkdir -p "${ROOT_DIR}/.ssh"
    chmod 700 "${ROOT_DIR}/.ssh"

    local key_name
    key_name="$(basename "${key_file}")"
    cp "${key_file}" "${ROOT_DIR}/.ssh/${key_name}"
    chmod 600 "${ROOT_DIR}/.ssh/${key_name}"

    if [[ -n "${pub_file}" && -f "${pub_file}" ]]; then
        cp "${pub_file}" "${ROOT_DIR}/.ssh/$(basename "${pub_file}")"
        chmod 644 "${ROOT_DIR}/.ssh/$(basename "${pub_file}")"
    fi

    cat > "${ROOT_DIR}/.ssh/config" << EOF
Host ${host}
    HostName ${host}
    User git
    IdentityFile ~/.ssh/${key_name}
    IdentitiesOnly yes
    StrictHostKeyChecking accept-new
EOF
    chmod 600 "${ROOT_DIR}/.ssh/config"

    eval "$(ssh-agent -s | grep -E '^SSH_')"
    {
        echo "export SSH_AUTH_SOCK=${SSH_AUTH_SOCK}"
        echo "export SSH_AGENT_PID=${SSH_AGENT_PID}"
    } > "${ROOT_DIR}/.ssh/agent.env"
    ssh-add "${ROOT_DIR}/.ssh/${key_name}" 2>/dev/null || true

    echo "  ✓ SSH configurado (${key_name} → ${host})"
    if [[ "${host}" == "github.com" ]]; then
        ssh -T -o BatchMode=yes -o ConnectTimeout=5 "git@${host}" 2>&1 || true
    fi
}

setup_gh() {
    if [[ -z "${GITHUB_TOKEN:-}" ]]; then
        echo "  ↷ GitHub CLI omitido (GITHUB_TOKEN vacío)"
        return 0
    fi

    if ! command -v gh >/dev/null 2>&1; then
        echo "  ⚠ gh no está instalado en la imagen"
        return 0
    fi

    if gh auth status &>/dev/null; then
        echo "  ✓ GitHub CLI ya autenticado"
        return 0
    fi

    echo "${GITHUB_TOKEN}" | gh auth login --with-token
    echo "  ✓ GitHub CLI autenticado"
}

setup_git() {
    if [[ -z "${GIT_USER_NAME:-}" || -z "${GIT_USER_EMAIL:-}" ]]; then
        echo "  ↷ Git omitido (GIT_USER_NAME / GIT_USER_EMAIL vacíos)"
        return 0
    fi

    git config --global user.name "${GIT_USER_NAME}"
    git config --global user.email "${GIT_USER_EMAIL}"
    git config --global credential.helper store
    git config --global core.editor "${GIT_EDITOR:-nano}"

    if [[ -n "${SSH_KEY_FILE:-}" ]]; then
        git config --global "url.ssh://git@${SSH_HOST:-github.com}/.insteadOf" "https://${SSH_HOST:-github.com}/"
    fi

    echo "  ✓ Git configurado (${GIT_USER_NAME} <${GIT_USER_EMAIL}>)"
}

setup_npm() {
    if [[ ! -f "${WORKSPACE}/package.json" ]]; then
        echo "  ↷ npm omitido (sin package.json)"
        return 0
    fi
    if [[ -d "${WORKSPACE}/node_modules" ]]; then
        echo "  ✓ node_modules ya presente"
        return 0
    fi
    echo "  → npm ci (primera vez en el contenedor)..."
    (cd "${WORKSPACE}" && npm ci)
    echo "  ✓ npm ci listo"
}

setup_all() {
    load_env
    setup_zsh
    setup_ssh
    setup_gh
    setup_git
    setup_npm
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "🔧 Configurando entorno de desarrollo..."
    setup_all
    echo "✅ Entorno listo"
fi
