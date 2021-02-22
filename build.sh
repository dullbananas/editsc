wasm-pack build --target web --no-typescript --dev
mv --force pkg/*.wasm public/main.wasm
mv --force pkg/*.js public/bindings.js
rm -rf pkg

elm make src/Editsc.elm --output=public/elm.js
