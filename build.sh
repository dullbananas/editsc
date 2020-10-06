echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Main.js
elm make src/Main.elm --output=public/Main.js
cat ModuleLoader.js >> public/Main.js
cat src/*.js >> public/Main.js
echo "importModule('Main');" >> public/Main.js

# main.wasm
wasm-pack build --target web --no-typescript --dev
mv pkg/*.wasm public/main.wasm
mv pkg/*.js public/main-wasm.js
rm -rf pkg

echo "Build complete"
