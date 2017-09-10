# Requirements: jq atool

set -ex

export name=$(jq --raw-output '.name | gsub(" "; "-") | gsub("™"; "") | ascii_downcase' ext/manifest.json)
export version=$(jq --raw-output '.version' ext/manifest.json)

mkdir -p 'dist'

zip_file="dist/${name:?}-${version:?}.zip"
rm -f "${zip_file:-}"

apack "${zip_file:-}" ./ext --

echo "Publish at https://chrome.google.com/webstore/developer/dashboard"
