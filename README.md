## Message - The simplest way to create presentations
[message.fhtr.net](http://message.fhtr.net)

Message is the simplest way to create presentation slides.

Here's the ten-second tutorial:

    Write the point for the slide and an add an illustration
    http://poemyou.com/images/fhtr.png

    Here's another slide with just the main point

    http://poemyou.com/images/fhtr.png
    (Speaker notes like this help you talk about slides with no text)

    You can embed videos into your slides
    http://youtu.be/-t8K4L6YJ6Q

    And audio
    http://open.spotify.com/track/2pnJ87yTVpkgtZh6Tq4vKh

    And even tweets
    https://twitter.com/ilmarihei/status/352789415925530624

Ok, good job!
You're now ready to make great presentations!

As you edit your slides, Message saves your work every five seconds.
You can also press cmd-s to force a save.

Message embeds YouTube and Vimeo video URLs, Spotify and Soundcloud audio URLs, Twitter tweets and URLs ending in .mp3, mp4, .jpg, .png and .gif.


# Installation in three steps

First, you need [MongoDB](http://mongodb.org) and [Node.js](http://nodejs.org).

Second, go to [GitHub > Account settings > Applications](https://github.com/settings/applications/new) and
create a new application called Message-Local. Copy the client ID and the client secret into the [config.js](blob/master/config.js) file.

Good, now your user authentication system is set up.

Third, install the dependencies and start the servers.

    npm install
    mongod --config mongod.config &
    node app.js

Now point your browser at http://localhost:3000

Click on the Github link and complete the authentication flow and you should be good to go.


# Deploying to Heroku

The message.fhtr.net app runs on Heroku and uses MongoHQ for the database.

Likewise, you can deploy your copy of the app to Heroku without much trouble.

First, you need to edit config.js and make mongodb_server point to a public MongoDB server.

    # Then create the Heroku app.
    heroku create
    
    # Set up the auth callback server.
    # Remember to create a GitHub app to point to this new URL.
    heroku config:set AUTH_SERVER=http://your_heroku_app.herokuapp.com

    # Deploy the app to Heroku.
    git push heroku master:master

Ok, you're good to go!


# Deploying a production version

If you want to switch NODE_ENV to production, you need to edit index.dot and change the CDN to point to your own CDN.

To create the compiled build files, run bin/build.sh. The build script places the bundled files into build/ and you can copy them over to your server.
Copy the bundle file versions into config.js to make index.dot's CDN template work properly.


# License

The MIT License (MIT)

Copyright (c) 2013 Ilmari Heikkinen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.