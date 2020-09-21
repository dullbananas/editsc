echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Main.js
elm make src/Main.elm --output=public/Main.js
cat ModuleLoader.js >> public/Main.js
cat src/*.js >> public/Main.js
echo "importModule('Main');" >> public/Main.js

# main.wasm
#ldc2 -mtriple=wasm32-unknown-unknown-wasm -L-allow-undefined -betterC -link-internally src/main.d
#mv main.wasm -t public
dub build --compiler=ldc2

echo "Build complete"
