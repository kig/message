"use strict";

var Slide = function() {
	this.comments = [];
	this.texts = [];
};

Slide.prototype.isEmpty = function() {
	return (this.texts.length === 0) && !this.embed && (this.comments.length === 0);
};

Slide.prototype.addText = function(line) {
	this.texts.push(line.trim().replace(/^\\/, ''));
};

Slide.prototype.addEmbed = function(line) {
	this.embed = line.trim();
};

Slide.prototype.addComment = function(line) {
	this.comments.push(line.trim());
};

Slide.prototype.addLine = function(line) {
	if (/^\s*\(/.test(line)) {
		this.addComment(line);
	} else if (/^((https?):)?\/\//.test(line)) {
		this.addEmbed(line);
	} else {
		this.addText(line);
	}
};

Slide.prototype.toJSON = function() {
	return {
		embed: this.embed,
		texts: this.texts,
		comments: this.comments
	};
};

Slide.prototype.render = function(element) {
	if (element.slide === JSON.stringify(this)) {
		// No changes since the previous render.
		return;
	}
	var textElement, embedElement, commentElement;
	var i = 0;
	element.innerHTML = '';
	var elems = 0;
	if (this.embed) {
		embedElement = this.parseEmbed(this.embed);
		element.append(embedElement);
		elems++;
	}
	if (this.texts.length > 0) {
		textElement = E.DIV({"class": "text"});
		for (i=0; i<this.texts.length; i++) {
			textElement.append(E.P(E.T(this.texts[i])));
		}
		element.append(textElement);
		elems++;
	}
	if (this.comments.length > 0) {
		commentElement = E.DIV({"class": "comment"});
		for (i=0; i<this.comments.length; i++) {
			commentElement.append(E.P(E.T(this.comments[i])));
		}
		element.append(commentElement);
	}
	if (elems === 1) {
		element.firstChild.classList.add('standalone');
	}
	element.slide = JSON.stringify(this);
};

Slide.prototype.parseEmbed = function(v) {
	var idx = v.indexOf(' ');
	var attrib;
	if (idx !== -1) {
		attrib = E('.attrib', v.substring(idx+1, v.length));
		v = v.substring(0, idx);
	}
	var card = E('.embed');
	var yt = v.match(/^(https?:\/\/)?(www\.)?(youtu\.be\/|youtube\.com\/watch(\/|\/?(\?v=)?))([a-zA-Z0-9_-]+)/);
	var vimeo = v.match(/^(https?:\/\/)?((www\.)?vimeo\.com)\/([a-zA-Z0-9_-]+)/);
	var pinterest = v.match(/^(https?:\/\/)?((www\.)?pinterest\.com)\/pin\/([0-9]+)\/?$/);
	var soundcloud = v.match(/^(https?:\/\/)?((www\.)?soundcloud\.com)\//);
	var twitter = v.match(/^(https?:\/\/)?((www\.)?twitter\.com)\//);
	var skfbly = v.match(/^(https?:\/\/)?skfb.ly\//);
	if (yt) {
		card.append(E.IFRAME({
			datasrc:"http://www.youtube.com/embed/" + 
				encodeURIComponent(yt[6])+"?html5=1", 
			width: 960, height: 540, attrs: {frameborder: 0, allowfullscreen: true}
		}));
		card.classList.add("youtube");
	} else if (vimeo) {
		card.append(E.IFRAME({
			datasrc:"http://player.vimeo.com/video/" + 
				encodeURIComponent(vimeo[4])+"?html5=1", 
			width: 960, height: 540, attrs: {frameborder: 0, allowfullscreen: true}
		}));
		card.classList.add("vimeo");
	} else if (/^spotify:[a-z]+:[a-zA-Z0-9]+$/.test(v) || /^http:\/\/open\.spotify\.com\/[a-z]+\/[a-zA-Z0-9]+$/.test(v)) {
		var url = v.match(/\/([a-z]+)\/([a-zA-Z0-9]+)$/);
		if (url) {
			v = "spotify:"+url[1]+":"+url[2];
		}
		card.append(E.IFRAME({
			datasrc:"https://embed.spotify.com/?uri="+encodeURIComponent(v),
			width:300, height:380, attrs: {frameborder:0, allowtransparency: true}}));
		card.classList.add("spotify");

	} else if (pinterest) {
		var a = E('a', {"href": v});
		a.setAttribute('data-pin-do', 'embedPin');
		card.append(a);
		card.classList.add('pinterest');
		E.loadScript('//assets.pinterest.com/js/pinit.js', 'pinterest');

	} else if (soundcloud) {
		card.append(E.IFRAME({datasrc:"https://w.soundcloud.com/player/?url="+encodeURIComponent(v), width:360, height:450, attrs: {frameborder:0, border:0, allowtransparency:true}}));
		card.classList.add('soundcloud');

	} else if (twitter) {
		card.append(E('.twitter-container',
			E('blockquote.twitter-tweet', {width:470}, E.A({href:v}))
		));
		if (!E.id('twitter')) {
			E.loadScript('//platform.twitter.com/widgets.js', 'twitter');
		} else {
			E.defer(function() {
				twttr.widgets.load();
			});
		}
		card.classList.add('soundcloud');

	} else if (skfbly) {
		card.append(E.IFRAME({datasrc:v+"?autostart=0&transparent=0&autospin=0.2&controls=1", width:720, height:480, attrs: {frameborder:0, border:0, allowtransparency:true}}));
		card.classList.add('youtube');

	} else {
		if (/\.(png|gif|jpe?g|webp)$/.test(v)) {
			card.append(E('.image', E.fadeInImage(v)));
		} else if (/\.(webm|mp4)$/.test(v)) {
			card.append(E('.video', E.loadVideo(v)));
		} else if (/\.(mp3|m4a)$/.test(v)) {
			card.append(E('.audio', E.loadAudio(v)));
		} else {
			card.append(E('.text', E.A({href: v, target: "message-link"}, v)));
		}
	}

	if (attrib) {
		card.append(attrib);
	}
	return card;
};

