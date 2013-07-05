"use strict";

(function() {
	var container = E.id('container');
	var spinner;
	if (window.User.username) {
		spinner = E.Spinner.create(container, 300);
	} else {
		$(container).hide();
	}

	var SERVER = document.location.origin;
	var defaultSlides = 'http://fhtr.org/images/crystal_10.jpg\nMessage\n';

	/*
	 * Authentication & preso viewing flow
	 * 
	 * If you're not authenticated
	 * - Home page is the pitch preso, popular shared presos, Sign Up / Sign In
	 * - Person page is the public presos of the person
	 * - Preso page is the preso if it's public, otherwise 403 to auth flow
	 *   - Edit directs to auth flow
	 * 
	 * If you're authenticated
	 * - Home page has your presos instead of sign up
	 * - Your person page has all your presos
	 * - Your preso pages start in edit mode and have a link to preso mode
	 *   - Edit mode has form to share the preso with others
	 * - Other presos start in edit mode if it's shared with you, otherwise preso mode
	 *   - Edit shows request share flow
	 */

	var App = function(server) {
		this.server = server;
	};

	App.prototype = {
		server: null,
		url: null,
		query: null,
		page: "/",
		user: null,

		init: function() {
			this.parseURL();
		},

		parseURL: function() {
			this.url = E.URL.parse(document.location.toString());
			this.query = this.url.query;
			this.setPage(this.query.page);
		},

		setPage: function(page) {
			if (!this["/" + page]) {
				this.page = "/";
			} else {
				this.page = page;
			}
		},

		handleAuth: function(user) {
			this.user = user;
			var handler = (this["/" + this.page] || this["/"]);
			var self = this;
			handler.call(self);
		},

		"/": function() {
			if (this.user.username) {
				this["/list"]();
			} else {
				console.log("/");
			}
		},

		"/view": function() {
			var self = this;
			$('#authbox').hide();
			$.get(
				this.server+'/presentation/get',
				{id: this.query.id},
				function(res) {
					initSlides(res, self, false);
				}
			);
		},

		"/edit": function() {
			var self = this;
			$('#authbox').hide();
			$.get(
				this.server+'/presentation/get',
				{id: this.query.id},
				function(res) {
					initSlides(res, self, true);
				}
			);
		},

		"/list": function() {
			var self = this;
			$.get(
				this.server+'/presentation/list',
				{person: this.query.person || this.user.username},
				function(res) {
					for (var i=0; i<res.length; i++) {
						res[i].date = Date.parse(res[i].date);
					}
					res.sort(function(a, b) {return a.date - b.date;});
					initPresentationList(res, self);
				}
			);
		},

		save: function(q, callback) {
			var ss = E.q('#saveSpinner');
			if (!ss) {
				ss = E('#saveSpinner', {style: {position: 'fixed', bottom: '10px', right: '10px', zIndex: 101}});
				E.sz(ss, 25, 25);
				document.body.appendChild(ss);
			}
			var spin = E.Spinner.create(ss, 200, {size: 23, lineWidth: 1});
			$.post(
				this.server+'/presentation/put',
				{
					_csrf: this.user.token,
					id: this.query.id,
					title: q.title, body: q.body, published: q.published, story: serializeStory()
				},
				function(res) {
					E.Spinner.remove(spin);
					callback(res);
				}
			);
		},

		create: function(callback) {
			$.post(
				this.server+'/presentation/put',
				{
					_csrf: this.user.token,
					id: null,
					title: 'Unnamed', body: 'Message', published: false
				},
				function(res) {
					callback(res);
				}
			);
		},

		trash: function(id, callback) {
			$.post(
				this.server+'/presentation/delete',
				{
					_csrf: this.user.token,
					id: id
				},
				function(res) {
					callback(res);
				}
			);
		}

	};

	var renderPresentationListItem = function(r, app) {
		var li = E.LI(
			E.A(E.T(r.title || "Unnamed (Click to edit)"), {
				href: "?page=edit&id="+encodeURIComponent(r.id)
			}),
			E.T(' '),
			E.A(E.T("View"), {
				href: "?page=view&id="+encodeURIComponent(r.id)
			}),
			E.T(' '),
			E.SPAN(E.T(r.published ? "Public" : "Private")),
			E.T(' '),
			E.BUTTON('Delete', {
				onclick: function() {
					var self = this;
					self.disabled = true;
					E.css(li, {
						transition: '0.5s',
						opacity: 1,
						height: li.getBoundingClientRect().height + 'px',
						overflow: 'hidden'
					});
					E.deferStyle(li, 'opacity', 0.5);
					app.trash(r.id, function(res) {
						E.css(li, {opacity: 0, height: '0px'});
						setTimeout(function() {
							E.remove(li);
						}, 500);
					});
				}
			})
		);
		return li;
	};

	var renderPresentationList = function(res, app) {
		var list = E.UL({"class": "presentations"});
		list.append(res.map(function(r, i){ 
			var li = renderPresentationListItem(r, app); 
			return li;
		}));
		var container = E.id('ui');
		container.innerHTML = '';
		container.append(
			E.H1(
				E.fadeInImage('/images/fhtr_icon.png', 15),
				E.fadeIn(E.SPAN(' Message'))
			),
			E.fadeIn(E.P(E.BUTTON('Create New Presentation', {
				onclick: function() {
					app.create(function(res) {
						res.id = res._id;
						var it = renderPresentationListItem(res, app);
						$(list).append(it);
						E.fadeIn(it, 1000);
					});
				}
			}))),
			E.fadeIn(list)
		);
	};

	var initPresentationList = function(res, app) {
		E.Spinner.remove(spinner, function() {
			renderPresentationList(res, app);
		});
	};

	var initSlides = function(res, app, editing) {
		E.Spinner.remove(spinner, function() {
			var slides = new Slides((res && res.body) || defaultSlides, container);
			slides.published = (res && res.published);
			slides.title = (res && res.title) || 'Unnamed';
			slides.app = app;
			slides.id = (res && res._id) || '';
			if (editing && app.user) {

				var showStory = function() {
					console.log('showStory');
					$('#slides').hide();
					$('#narrative').show();
				};

				var showSlides = function() {
					$('#slides').show();
					$('#narrative').hide();
				};

				var title = E.INPUT({id: 'slide-title'});
				var editor = E.TEXTAREA({id: 'slide-text'});
				var publishCheckbox = E.CHECKBOX({id: "slide-published"});
				var editorDiv = E.DIV(
					{"class": 'slide-editor'},
//					E.H3(E.SPAN('Story', {onclick: showStory}), E.T(' | Slides')),
					E.DIV(
						{"class": 'published'},
						publishCheckbox,
						E.LABEL("Published", {attrs: {"for": "slide-published"}})
					),
					E.LABEL("Slide editor", {attrs: {"for": "slide-text"}}),
					editor
				);
				$('#editor').addClass('editor').prepend(title);
				$('#container').addClass('editor');
				$('#slides').append(editorDiv);

				var storyObj = null;
				try {
					storyObj = JSON.parse(res.story);
				} catch(e) {}
				var storyFields = {};
				var p = function(id, title, type, value) {
					value = storyObj ? storyObj[id] : value;
					var input = E[type]({id: id, value: value});
					if (type === 'TEXTAREA') {
						input.append(E.T(value));
					}
					var div = E.DIV({id: id+"-container", "class": 'published'});
					if (title) {
						div.append(E.LABEL({attrs: {"for": id}}, title));
					}
					div.append(input);
					storyFields[id] = input;
					return div;
				};

				window.serializeStory = function() {
					var obj = {};
					for (var i in storyFields) {
						obj[i] = storyFields[i].value;
					}
					return JSON.stringify(obj);
				};

				var notesEditor = p(
					'notes',
					'Notes',
					'TEXTAREA',
					("Here's a couple questions that your presentation should answer:\n"
						+ "What's in it for me?\n"
						+ "What is the problem you're solving?\n"
						+ "How does your solution make my life better?\n"
						+ "What three points should I take home from this?\n"
						+ "\n"
						+ "A couple tidbits:\n"
						+ "What kind of connector do you need for the projector?\n"
						+ "Do you need speakers for audio?\n"
						+ "Are you going to show videos? Can you download them?\n"
						+ "Does the podium have wired internet?\n"
						+ "Are you presenting from your own computer?\n"
						+ "(If not, do they want PDFs or PPTs of the deck?)\n"
						+ "Practice a bit with the mic and the A/V before starting."
					)
				);
				var scriptEditor = p(
					'script',
					'Script',
					'TEXTAREA',
					("Write your presentation script here. Jot down roughly what you're going to say and when."
					 + "\n\nTry to split your presentation into 10-minute segments that have an intermission between them."
					 + " This intermission can be a video, change of speaker, a product demo or anything that gives the "
					 + "audience a break from focusing on you.\n\n"
					 + "If you're writing a word-by-word script, it takes roughly 15 lines to fill up a minute. "
					 + "If you're not writing word-by-word, you can try rehearsing the script with a timer and writing down a timer mark every five minutes or so. The script should help you figure out your pacing and stick to it."
					)
				);
				$(scriptEditor).click(function(ev) {
					if (ev.target === scriptEditor) {
						$(scriptEditor).removeClass('focusmode');
					}
				}).find('textarea').focus(function(ev) {
					$(scriptEditor).addClass('focusmode');
				});
				var scriptEditorDiv = E.DIV(
					{"class": 'slide-editor'},
//					E.H3(E.T('Story | '), E.SPAN('Slides', {onclick: showSlides})),
					p('presentation-time', 'Presentation time in minutes', 'NUMBER', 30),
					p('audience-size', 'Size of audience', 'NUMBER', 15),
					p('tagline', 'Tagline', 'TEXT', 'The catchphrase for your preso'),
					notesEditor,
					scriptEditor
				);
				$('#narrative').append(scriptEditorDiv);

				slides.setPublishCheckbox(publishCheckbox);
				slides.setTitleEditor(title);
				slides.setEditor(editor);
				slides.resize();

				var saveOnChange = function(){ 
					var value = this.checked == null ? this.value : this.checked;
					if (this.lastValue !== value) {
						this.lastValue = value;
						slides.requestSave();
					}
				};

				$('#editor input')
					.add($('#editor textarea'))
					.each(function() { 
						var value = this.checked == null ? this.value : this.checked;
						this.lastValue = value;
					})
					.keyup(saveOnChange)
					.change(saveOnChange);

			}
		});
	};

	var app = new App(SERVER);
	app.init();
	app.handleAuth(window.User);

})();
