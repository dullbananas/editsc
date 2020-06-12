# Create build directory since it's empty in git repo
mkdir static/build

# Run elm compiler
cd elm
elm make src/Main.elm src/Styles.elm --output=../static/build/Elm.js
cd ..

# Run typescript compiler
cd js
tsc --project tsconfig.json
cd ..
