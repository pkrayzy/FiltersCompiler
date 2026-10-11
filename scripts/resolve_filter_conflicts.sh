#!/bin/bash

# Folders where we always want to keep the deletion if a conflict occurs
TARGET_FOLDERS=(
  "filters/filter_15_DnsFilter"
  "filters/filter_24_QuickFixes"
  "filters/filter_12_Safari"
)

echo "Checking for merge conflicts in target folders..."

# Find all unmerged files
UNMERGED_FILES=$(git diff --name-only --diff-filter=U)

if [ -z "$UNMERGED_FILES" ]; then
  echo "No merge conflicts found."
  exit 0
fi

FILES_RESOLVED=0

for FILE in $UNMERGED_FILES; do
  for FOLDER in "${TARGET_FOLDERS[@]}"; do
    if [[ "$FILE" == "$FOLDER"* ]]; then
      # Check if the file was deleted by us
      # We use git status to see if it's marked as 'deleted by us'
      STATUS=$(git status "$FILE")
      if echo "$STATUS" | grep -q "deleted by us"; then
        echo "Resolving conflict for $FILE (Deleted by us) -> staging deletion"
        git rm "$FILE"
        ((FILES_RESOLVED++))
      fi
    fi
  done
done

if [ $FILES_RESOLVED -eq 0 ]; then
  echo "No 'deleted by us' conflicts found in the specified folders."
else
  echo "Successfully resolved $FILES_RESOLVED conflicts."
fi
