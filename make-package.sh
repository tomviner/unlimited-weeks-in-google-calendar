# Requirements: jq atool

set -ex

export name=$(jq --raw-output '.name | gsub(" "; "-") | gsub("™"; "") | ascii_downcase' manifest.json)
export version=$(jq --raw-output '.version' manifest.json)

mkdir -p 'dist'

zip_file="dist/${name:?}-${version:?}.zip"
rm -f "${zip_file:-}"

apack "${zip_file:-}" . -- \
    --exclude '/.*' '/dist/*' '/*.sh' '/*.md' '/assets/*'

echo "Publish at https://chrome.google.com/webstore/developer/dashboard"
