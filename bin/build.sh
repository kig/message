#!/bin/bash

# Concatenate script files 

export LIB_FILES=$(echo public/js/{vendor/stylus,E}.js)
export APP_FILES=$(echo public/js/{slide,timer,slides,main}.js)

export CLOSURE_FLAGS="--compilation_level=SIMPLE_OPTIMIZATIONS"
export CLOSURE="java -jar /Users/ilmari/Downloads/compiler-latest/compiler.jar $CLOSURE_FLAGS"

function version {
	stat -c %Y $(ls -t $* | head -n 1)
}

rm -r build/*;
mkdir -p build/message/images build/message/css build/message/js &&
$CLOSURE --js $LIB_FILES > build/message/js/lib.$(version $LIB_FILES).js &&
$CLOSURE --js $APP_FILES > build/message/js/app.$(version $APP_FILES).js &&
cp public/images/*.* build/message/images/ &&
stylus public/css/style.styl &&
cat public/css/{base,style}.css > build/message/css/base.$(version public/css/{base.css,style.styl}).css &&
echo "Build complete"


