set -x -e

# Push updated filter lists to the repo (without patches).
git status
# either 'report-adguard.txt' or 'report-third-party.txt' should be present
git add report-*.txt
git add filters
git add platforms
git diff-index --quiet HEAD || git commit -m "skip ci. build from $(date)"
git push origin master
