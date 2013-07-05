/*
 * Config vars for Message.
 */

module.exports = {

	port: process.env.PORT || 3000,
	server: process.env.AUTH_SERVER || "http://localhost:3000",

	mongodb_server: 'mongodb://localhost:27017/Message-Local',

	sessionSecret: "a very secret session",

	auth: {

		/*
		facebook: {
			strategy: require('passport-facebook').Strategy,
			args: {
				clientID: "",
				clientSecret: ""
			}
		},

		google: {
			strategy: require('passport-google-oauth').OAuth2Strategy,
			args: {
				clientID: "",
				clientSecret: ""
			},
			authenticateOptions: {
				scope: [
					'https://www.googleapis.com/auth/userinfo.profile',
					'https://www.googleapis.com/auth/userinfo.email'
				]
			}
		},

		twitter: {
			strategy: require('passport-twitter').Strategy,
			args: {
				consumerKey: "",
				consumerSecret: ""
			}
		},

		github: {
			strategy: require('passport-github').Strategy,
			args: {
				clientID: "",
				clientSecret: ""
			}
		}
		 */

	}

};
