"use strict";

var Slides = function(str, container) {
	this.currentSlide = 0;
	this.lastRender = 0;
	this.renderRequested = 0;
	this.published = false;
	this.title = null;
	this.setSlidesText(str);
	this.elements = [];
	this.container = container;
	this.container.tabIndex = -1;
	this.timer = new Timer();
	this.timer.start();
	this.addEventListeners();
	this.render();
};

Slides.prototype.addEventListeners = function() {
	var eventTypes = ['click', 'mouseup', 'mousedown', 'mousemove', 'dblclick'];
	E.on(this.container, eventTypes, this);
	E.on(window, ['resize', 'keyup', 'keydown'], this);
};

Slides.prototype.removeEventListeners = function() {
	var eventTypes = ['click', 'mouseup', 'mousedown', 'mousemove', 'dblclick'];
	E.off(this.container, eventTypes, this);
	E.off(window, ['resize', 'keyup', 'keydown'], this);
	if (this.textarea) {
		E.off(this.textarea, ['mouseup', 'change'], this);
	}
};

Slides.prototype.parse = function(str) {
	var lines = str.split("\n");
	var slides = [new Slide];
	for (var i=0; i<lines.length; i++) {
		var slide = slides[slides.length-1];
		if (this.isLineEmpty(lines[i])) {
			if (!slide.isEmpty()) {
				slides.push(new Slide);
			}
		} else {
			slide.addLine(lines[i]);
		}
	}
	if (slides.length > 1 && slides[slides.length-1].isEmpty()) {
		slides.pop();
	}
	return slides;
};

Slides.prototype.isLineEmpty = function(line) {
	return line.trim().length == 0;
};

Slides.prototype.setSlidesText = function(str) {
	this.slidesText = str || '';
	this.slides = this.parse(this.slidesText);
};

Slides.prototype.setPublishCheckbox = function(checkbox) {
	checkbox.checked = this.published;
	this.publishedCheckbox = checkbox;
};

Slides.prototype.setTitleEditor = function(input) {
	input.value = this.title;
	this.titleEditor = input;
};

Slides.prototype.setEditor = function(textarea) {
	$(textarea).text(this.slidesText);
	this.textarea = textarea;
	E.on(this.textarea, ['mouseup', 'change'], this);
};

Slides.prototype.render = function() {
	var i = 0|0;
	var self = this;
	var onclick = function() {
		if (self.textarea) {
			self.gotoSlide(this.index);
		}
	};
	for (i=0; i<this.slides.length; i++) {
		var slide = this.slides[i];
		var element = this.elements[i];
		if (!element) {
			element = E.DIV();
			E.on(element, 'click', onclick);
			this.elements.push(element);
			this.container.append(element);
		}
		element.className = 'slide s'+i;
		element.index = i;
		slide.render(element);
	}
	var dels = this.elements.splice(this.slides.length);
	dels.forEach(E.remove);

	this.resize();
	this.gotoSlide(this.currentSlide);
};

Slides.prototype.resize = function(ev) {
	$('.vimeo iframe').add($('.youtube iframe')).each(function() {
		var r = {
			width: parseInt(this.getAttribute('width')),
			height: parseInt(this.getAttribute('height'))
		};
		var pr = this.parentNode.getBoundingClientRect();
		var scale = Math.min(pr.width / r.width, pr.height / r.height);
		var w = Math.max(1, r.width * scale);
		var h = Math.max(1, r.height * scale);
		E.sz(this, w, h);
	});
	var w = this.container.getBoundingClientRect().width;
	this.container.style.fontSize = (w/1100)*100 + '%';
};

Slides.prototype.requestRender = function() {
	if (this.renderRequested) {
		return;
	}
	var self = this;
	var delay = 200;
	this.renderRequested = setTimeout(function() {
		self.render();
		self.renderRequested = false;
		self.lastRender = Date.now();
	}, delay - Math.min(delay, (Date.now() - this.lastRender)));
};

Slides.prototype.requestSave = function() {
	if (this.saveRequested) {
		return;
	}
	var self = this;
	var delay = 5000;
	this.saveRequested = setTimeout(function() {
		self.save();
		self.saveRequested = false;
		self.lastSave = Date.now();
	}, delay);
};

Slides.prototype.nextSlide = function() {
	this.gotoSlide(Math.min(this.slides.length-1, this.currentSlide+1));
};

Slides.prototype.prevSlide = function() {
	this.gotoSlide(Math.max(0, this.currentSlide-1));
};

Slides.prototype.gotoSlide = function(idx) {
	var len = this.slides.length;
	if (idx < 0) {
		idx = len + (idx % len);
	} else {
		idx %= len;
	}

	var pl = this.elements[this.currentSlide];
	var el = this.elements[idx];
	this.currentSlide = idx;

	if (pl === el && el && el.classList.contains('current')) {
		return;
	}
	if (pl && pl.classList.contains('current')) {
		pl.classList.remove('current');
		pl.classList.add('previous');
		setTimeout(function() {
			pl.classList.remove('previous');
		}, 500);
	}
	if (el && !el.classList.contains('current')) {
		el.classList.remove('previous');
		if (this.firstGoto) {
			E.defer(function() { el.classList.add('current'); });
			this.firstGoto = false;
		} else {
			el.classList.add('current');
		}
		$(el).find('iframe').each(function() {
			if (this.datasrc) {
				this.setAttribute('src', this.datasrc);
				delete this.datasrc;
			}
		});
	}

	if (el && this.textarea) {
		var d = this.container.scrollTop - (el.offsetTop-150);
		$(this.container).animate({ scrollTop: (el.offsetTop-150) }, Math.min(Math.abs(d*2), 800));
	}

	console.log("%cSlide "+(this.currentSlide+1)+"/"+this.slides.length, "color: blue; font-size: large");
	console.log("%c"+this.timer, "color: black;");
	var comments = this.slides[this.currentSlide].comments;
	for (var i=0; i<comments.length; i++) {
		console.log(comments[i]);
	}
};

Slides.prototype.save = function() {
	if (this.titleEditor) {
		this.title = this.titleEditor.value;
	}
	if (this.publishedCheckbox) {
		this.published = this.publishedCheckbox.checked;
	}
	this.app.save({
		title: this.title,
		body: this.slidesText,
		published: this.published
	}, function(res) {
		console.log('save', res);
	});
};

Slides.prototype.handleEvent = function(ev) {
	var t = ev.target.tagName;
	var isInput = (t === 'INPUT' || t === 'TEXTAREA');

	switch (ev.type) {
	case 'change':
		this.parseEditor();
		break;

	case 'click':
		var slide = $(ev.target).closest('.slide')[0];
		if (slide) {
			if ($(slide).closest('.editor').length === 0) {
				var cr = slide.getBoundingClientRect();
				var x = ev.clientX - cr.left;
				if (x < cr.width*(1/5)) {
					this.prevSlide();
				} else if (x > cr.width*(4/5)) {
					this.nextSlide();
				}
				ev.preventDefault();
			}
		}
		break;

	case 'mouseup':
		if (t === 'TEXTAREA') {
			this.parseEditor();
		}
		break;

	case 'keydown':
		if (E.Key.match(ev, ['s']) && ev.metaKey) {
			this.save();
			ev.preventDefault();
		}
		break;

	case 'keyup':
		if (t === 'TEXTAREA') {
			this.parseEditor();
		}
		if (!isInput && !ev.shiftKey && !ev.altKey && !ev.ctrlKey) {
			if (E.Key.match(ev, [E.Key.ENTER, E.Key.SPACE, E.Key.RIGHT])) {
				this.nextSlide();
				ev.preventDefault();
			} else if (E.Key.match(ev, [E.Key.BACKSPACE, E.Key.LEFT])) {
				this.prevSlide();
				ev.preventDefault();
			}
		}
		break;

	case 'resize':
		this.resize(ev);
		break;
	}
};



Slides.prototype.getEditorPosition = function() {
	return this.textarea.selectionStart;
};

Slides.prototype.getEditorSlide = function() {
	var idx = this.getEditorPosition();
	return Math.max(0, this.parse(this.textarea.value.substring(0, idx+1)).length - 1);
};

Slides.prototype.parseEditor = function() {
	var changed = false;
	var txt = this.textarea.value;
	if (txt !== this.slidesText) {
		this.setSlidesText(this.textarea.value);
		changed = true;
	}
	var idx = this.getEditorPosition();
	var slide = this.currentSlide;
	if (changed || idx !== this.lastRenderEditorPosition) {
		this.lastRenderEditorPosition = idx;
		slide = this.getEditorSlide();
	}
	if (changed) {
		this.currentSlide = slide;
		this.requestRender();
		this.requestSave();
	} else if (this.currentSlide !== slide) {
		this.gotoSlide(slide);
	}
};

