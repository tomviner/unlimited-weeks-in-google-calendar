# Requirements: jq atool

set -ex

export name=$(jq --raw-output '.name | gsub(" "; "-") | gsub("™"; "") | ascii_downcase' manifest.json)
export version=$(jq --raw-output '.version' manifest.json)

mkdir -p 'dist'
apack "dist/${name:?}-${version:?}.zip" . -- --exclude '/.*' '/dist/*'

echo "Publish at https://chrome.google.com/webstore/developer/dashboard"
