#!/bin/bash
#
# Pull changes from upstream master, accepting all changes except those
# matching exclusion patterns (folders/files that should be skipped).
#
# Usage: ./pull-with-exclusions.sh [additional_patterns...]
#
# Excluded by default:
#   filters/filter_12_Safari
#   filters/filter_15_DnsFilter
#   filters/filter_24_QuickFixes
#   /filters/12_optimized.txt
#   /filters/12.txt
#   /filters/15_optimized.txt
#   /filters/15.txt
#   /filters/24_optimized.txt
#   /filters/24.txt

set -e

# --- Configuration ---
# Folders/files to always exclude from acceptance (revert to HEAD)
EXCLUDED_PATTERNS=(
    "filters/filter_12_Safari"
    "filters/filter_15_DnsFilter"
    "filters/filter_24_QuickFixes"
    "/filters/12_optimized.txt"
    "/filters/12.txt"
    "/filters/15_optimized.txt"
    "/filters/15.txt"
    "/filters/24_optimized.txt"
    "/filters/24.txt"
)

# Allow overriding exclusions via command-line arguments
if [[ $# -gt 0 ]]; then
    EXCLUDED_PATTERNS=("$@")
fi

# --- Helper: check if a path matches any exclusion pattern ---
is_excluded() {
    local path="$1"
    for pattern in "${EXCLUDED_PATTERNS[@]}"; do
        # Normalize: strip leading slash for comparison
        local normalized_pattern="${pattern#/}"
        local normalized_path="${path#/}"

        # Check if path starts with pattern or contains it as a segment
        if [[ "$normalized_path" == "$normalized_pattern"* ]] || \
           [[ "$normalized_path" == *"$normalized_pattern"* ]]; then
            return 0  # match found
        fi
    done
    return 1  # no match
}

# --- Step 1: Fetch from upstream master ---
echo "🔄 Fetching from upstream/master..."
git fetch upstream master 2>&1 | head -3
echo ""

# --- Step 2: Show what upstream has that we don't ---
echo "📡 Showing changes from upstream/master vs HEAD..."
echo ""

# Get changed files
CHANGED_FILES=$(git diff HEAD upstream/master --name-only 2>/dev/null || echo "")

if [[ -z "$CHANGED_FILES" ]]; then
    echo "ℹ No differences between HEAD and upstream/master."
    echo "   Your repository is already up to date."
    exit 0
fi

echo "Changed files from upstream/master:"
echo "===================================="
echo "$CHANGED_FILES" | sort
echo ""

# --- Step 3: Categorize included vs excluded ---
echo "Categorization (excluded patterns will be reverted to HEAD):"
echo "----------------------------------------------------"

# Use temp files to avoid subshell array issues
ACCEPTED_LIST=$(mktemp)
REVERT_LIST=$(mktemp)
ACCEPTED_COUNT=0
REVERT_COUNT=0

echo "$CHANGED_FILES" | while IFS= read -r file; do
    if is_excluded "$file"; then
        echo "REVERT:$file" >> "$REVERT_LIST"
        REVERT_COUNT=$((REVERT_COUNT + 1))
    else
        echo "ACCEPT:$file" >> "$ACCEPTED_LIST"
        ACCEPTED_COUNT=$((ACCEPTED_COUNT + 1))
    fi
done

echo "Summary:"
echo "  ✅ Accepted: $ACCEPTED_COUNT file(s)"
echo "  ❌ Excluded (will be reverted): $REVERT_COUNT file(s)"
echo ""

# Show excluded patterns for reference
echo "Exclusion patterns that will be preserved (reverted to HEAD):"
for pattern in "${EXCLUDED_PATTERNS[@]}"; do
    echo "  - $pattern"
done

echo ""
echo "Files to accept (keep from upstream/master):"
echo "--------------------------------------------"
if [[ -s "$ACCEPTED_LIST" ]]; then
    cat "$ACCEPTED_LIST"
else
    echo "  (none - all files match exclusion patterns)"
fi

echo ""
echo "Files to revert to HEAD:"
echo "-----------------------"
if [[ -s "$REVERT_LIST" ]]; then
    cat "$REVERT_LIST"
else
    echo "  (none)"
fi

echo ""
echo "💡 To actually apply this merge:"
echo "   git merge upstream/master --no-commit"
echo ""
echo "   # Then revert excluded files to HEAD:"
for pattern in "${EXCLUDED_PATTERNS[@]}"; do
    echo "   git checkout HEAD -- $pattern"
done
echo ""
echo "   git add -A"
echo "   git commit -m 'chore: pull from upstream master (with exclusions)'"

# Cleanup temp files
rm -f "$ACCEPTED_LIST" "$REVERT_LIST"
