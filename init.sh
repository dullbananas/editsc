# this file is referenced by .gitpod.yml

export PATH="/home/gitpod/bin:$PATH"

# Install Elm compiler
mkdir /home/gitpod/bin
cd /home/gitpod/bin
curl -L -o elm.gz https://github.com/elm/compiler/releases/download/0.19.1/binary-for-linux-64-bit.gz
gunzip elm.gz
chmod +x elm

npm install -g serve

curl -fsS https://dlang.org/install.sh | bash -s ldc
source ~/dlang/ldc-1.23.0/activate

cd /workspace/editsc
