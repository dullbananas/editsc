echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

# Main.js
elm make src/Main.elm --output=public/Main.js
cat ModuleLoader.js >> public/Main.js
cat src/*.js >> public/Main.js
echo "importModule('main');" >> public/Main.js

echo "Build complete"
