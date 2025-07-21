#!/bin/bash
#
# Helper script for backing up and restoring critical files.
#
# Usage:
# ./scripts/backup_handler.sh backup /path/to/temp_dir
# ./scripts/backup_handler.sh restore /path/to/temp_dir

set -e

ACTION=$1
TEMP_BACKUP=$2

if [ -z "$ACTION" ] || [ -z "$TEMP_BACKUP" ]; then
    echo "Usage: $0 [backup|restore] <temp_backup_directory>"
    exit 1
fi

# --- Configuration: Files and directories to protect ---
FILES_TO_PROTECT=(".env")
DIRS_TO_PROTECT=("data")
PATTERNS_TO_PROTECT=("star-discord-bot-*.json" "data/star-discord-bot-*.json")

BACKUP_FILENAME="star_kanri_backup.tar.gz"

perform_backup() {
    echo "  -> Backing up to $TEMP_BACKUP"
    mkdir -p "$TEMP_BACKUP"

    # Create a list of files and directories to be archived.
    # This approach handles cases where some files/dirs might not exist.
    local backup_list=()
    for item in "${FILES_TO_PROTECT[@]}" "${DIRS_TO_PROTECT[@]}"; do
        if [ -e "$item" ]; then
            backup_list+=("$item")
        fi
    done

    # Patterns need special handling with find
    # We use a subshell to avoid changing the main shell's options
    (
        shopt -s nullglob
        for pattern in "${PATTERNS_TO_PROTECT[@]}"; do
            # Use find to handle patterns safely, even with spaces
            while IFS= read -r -d $'\0' file; do
                backup_list+=("$file")
            done < <(find . -maxdepth 2 -path "./$pattern" -print0)
        done
    )

    if [ ${#backup_list[@]} -eq 0 ]; then
        echo "     - No files or directories to back up."
        return
    fi

    # Create a single compressed tarball.
    tar -czf "$TEMP_BACKUP/$BACKUP_FILENAME" "${backup_list[@]}"
    echo "     - Created compressed archive: $BACKUP_FILENAME"
}

perform_restore() {
    echo "  -> Restoring from $TEMP_BACKUP"
    if [ -f "$TEMP_BACKUP/$BACKUP_FILENAME" ]; then
        # Extract the archive to the current directory.
        tar -xzf "$TEMP_BACKUP/$BACKUP_FILENAME" -C .
        echo "     - Extracted archive $BACKUP_FILENAME"
    else
        echo "     - No backup archive found to restore."
    fi
}

if [[ "$ACTION" == "backup" ]]; then
    perform_backup
elif [[ "$ACTION" == "restore" ]]; then
    perform_restore
else
    echo "エラー: 無効なアクションが指定されました: $ACTION" >&2
    exit 1
fi