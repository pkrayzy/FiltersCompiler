set -x -e

# Push updated report.txt to the repo.
git status
git add report.txt
git checkout filters/ platforms/
git diff-index --quiet HEAD || git commit -m "skip ci. update report.txt from $(date)"
git push origin master
