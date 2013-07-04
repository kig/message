#!/bin/bash

# Concatenate script files 

export LIB_FILES=$(echo public/js/{vendor/stylus,E}.js)
export APP_FILES=$(echo public/js/{slide,timer,slides,main}.js)
export CSS_FILES=$(echo public/css/{base.css,style.styl})

export CLOSURE_FLAGS="--compilation_level=SIMPLE_OPTIMIZATIONS"
export CLOSURE="java -jar $HOME/Downloads/compiler-latest/compiler.jar $CLOSURE_FLAGS"

function version {
	cat $* | md5
}

export LIB_VERSION=$(version $LIB_FILES)
export APP_VERSION=$(version $APP_FILES)
export CSS_VERSION=$(version $CSS_FILES)

rm -r build/*;
mkdir -p build/message/images build/message/css build/message/js &&
$CLOSURE --js $LIB_FILES > build/message/js/lib.$LIB_VERSION.js &&
$CLOSURE --js $APP_FILES > build/message/js/app.$APP_VERSION.js &&
cp public/images/*.* build/message/images/ &&
node_modules/stylus/bin/stylus public/css/style.styl &&
cat public/css/{base,style}.css > build/message/css/base.$CSS_VERSION.css &&
echo "// Bundle versions" > bundle_versions.js &&
echo "module.exports.libVersion = '$LIB_VERSION';" >> bundle_versions.js &&
echo "module.exports.appVersion = '$APP_VERSION';" >> bundle_versions.js &&
echo "module.exports.cssVersion = '$CSS_VERSION';" >> bundle_versions.js &&
echo "Build complete"


