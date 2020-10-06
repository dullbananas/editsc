# this file is referenced by .gitpod.yml

export PATH="/home/gitpod/bin:$PATH"
mkdir /home/gitpod/bin
cd /home/gitpod

# Install Elm compiler
curl -L -o bin/elm.gz https://github.com/elm/compiler/releases/download/0.19.1/binary-for-linux-64-bit.gz
gunzip bin/elm.gz
chmod +x bin/elm

# Install static file server
npm install -g serve

# Install Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --profile minimal -y
source /workspace/.cargo/env
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

cd /workspace/editsc
