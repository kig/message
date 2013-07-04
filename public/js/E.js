"use strict";

Element.prototype.append = function() {
	for(var i=0; i<arguments.length; i++) {
		var arg = arguments[i];
		var arr = (arg instanceof Array) ? arg : [arg];
		for (var j=0; j<arr.length; j++) {
			if (typeof(arr[j]) == 'string') {
				this.appendChild(E.T(arr[j]));
			} else {
				this.appendChild(arr[j]);
			}
		}
	}
};

/**
 Creates and configures a DOM element.

 The tag of the element is given by name.

 If params is a string, it is used as the innerHTML of the created element.
 If params is a DOM element, it is appended to the created element.
 If params is an object, it is treated as a config object and merged
 with the created element.

 If params is a string or DOM element, the third argument is treated
 as the config object.

 Special attributes of the config object:
 * content
 - if content is a string, it is used as the innerHTML of the
 created element
 - if content is an element, it is appended to the created element
 * style
 - the style object is merged with the created element's style

 @param {String} name The tag for the created element
 @param params The content or config for the created element
 @param config The config for the created element if params is content
 @return The created DOM element
 */
var E = function(name) {
	var classes = name.match(/\.[^ \.\#]+/g);
	var id = name.match(/\#[^ \.\#]+/);
	name = name.match(/^[^ \.\#]+/);
	if (!name) {
		name = 'DIV';
	}
	var el = document.createElement(name);
	if (classes) {
		el.className = classes.join(" ").replace(/\./g, '');
	}
	if (id) {
		el.id = id[0].substring(1);
	}
	for (var i=1; i<arguments.length; i++) {
		var params = arguments[i];
		if (typeof(params) === 'string') {
			el.innerHTML += params;
		} else if (params.DOCUMENT_NODE) {
			el.appendChild(params);
		} else if (params.length) {
			for (var j=0; j<params.length; j++) {
				var p = params[j];
				if (params.DOCUMENT_NODE)
					el.appendChild(p);
				else
					el.innerHTML += p;
			}
		} else {
			if (params.style) {
				var style = params.style;
				delete params.style;
				var nparams = E.clone(params);
				params.style = style;
				params = nparams;
				for (var prop in style) {
					try {
						E.css(el, prop, style[prop]);
					} catch(e) {}
				}
			}
			if (params["class"]) {
				el.className = [params["class"]].join(' ');
				delete params["class"];
			}
			if (params.attrs) {
				for (var attr in params.attrs) {
					el.setAttribute(attr, params.attrs[attr]);
				}
				delete params.attrs;
			}
			if (params.content) {
				if (typeof(params.content) === 'string') {
					el.appendChild(E.T(params.content));
				} else {
					var a = params.content;
					if (!a.length) a = [a];
					a.forEach(function(p){ el.appendChild(p); });
				}
				params = E.clone(params);
				delete params.content;
			}
			E.extend(el, params);
		}
	}
	return el;
};

// Safari requires each canvas to have a unique id.
E.lastCanvasId = 0;
/**
 Creates and returns a canvas element with width w and height h.

 @param {int} w The width for the canvas
 @param {int} h The height for the canvas
 @param config Optional config object to pass to E()
 @return The created canvas element
 */
E.canvas = function(w,h,config) {
	var id = 'canvas-uuid-' + E.lastCanvasId;
	E.lastCanvasId++;
	if (!config) config = {};
	return E('canvas', E.extend(config, {id: id, width: w, height: h}));
};

E.id = function(id) {
	return document.getElementById(id);
};

E.tag = function(tagName, opt_elem) {
	return (opt_elem || document).getElementsByTagName(tagName);
};

E.byClass = function(className, opt_elem) {
	return (opt_elem || document).getElementsByClassName(className);
};

E.q = function(query, opt_elem) {
	return (opt_elem || document).querySelector(query);
};

E.qAll = function(query, opt_elem) {
	return (opt_elem || document).querySelectorAll(query);
};

E.T = function(text) {
	return document.createTextNode(text);
};

/**
 Creates a tag-making function. The returned function behaves like
 E(tagName, ...arguments)

 E.g.
 var d = E.make('DIV');
 d("foo", {id: 'bar'});
 is equivalent to
 E('DIV', "foo", {id: 'bar'});

 Note that all the tags in E.tags already have shortcut functions defined,
 for example
 DIV("foo", {id: 'bar'});
 and
 E.DIV("foo", {id: 'bar'});

 @param {string} tagName The element tag name to use.
 @return A tag-making function.
 */
E.make = function(tagName){
	return (function() {
		var args = [tagName];
		for (var i=0; i<arguments.length; i++) args.push(arguments[i]);
		return E.apply(E, args);
	});
}
E.tags = "a abbr acronym address area audio b base bdo big blockquote body br button canvas caption center cite code col colgroup dd del dfn div dl dt em fieldset form frame frameset h1 h2 h3 h4 h5 h6 head hr html i iframe img input ins kbd label legend li link map meta noframes noscript object ol optgroup option p param pre q s samp script select small span strike strong style sub sup table tbody td textarea tfoot th thead title tr tt u ul var video".toUpperCase().split(" ");
/*
 The following creates shortcut functions for creating HTML elements.
 The shortcuts behave like calling E(tagName, ...arguments).

 E.g.
 DIV( "Hello, world!", {className : 'hw'} );
 is equivalent to
 E('DIV', "Hello, world!", {className : 'hw'} );

 There are also E-namespaced versions of the functions:
 DIV == E.DIV

 The different input element types are handled in a special fashion:
 TEXT( 'value', {id : 'foo'} );
 is equivalent to
 E('INPUT', {type: 'TEXT', value: 'value'}, {id : 'foo'});
 If the first argument is not a string, it's parsed the same way as with E:
 TEXT( {id : 'foo', value : 'bar'} );
 is equivalent to
 E('INPUT', {type: 'TEXT'}, {id : 'foo', value : 'bar'});

 */
(function() {
	E.tags.forEach(function(t) {
		E[t] = E.make(t);
	});
	var makeInput = function(t) {
		return (function(value) {
			var args = [{type: t}];
			var i = 0;
			if (typeof(value) == 'string') {
				args[0].value = value;
				i++;
			}
			for (; i<arguments.length; i++) args.push(arguments[i]);
			return E.INPUT.apply(E, args);
		});
	};
	var inputs = ['SUBMIT', 'TEXT', 'RESET', 'HIDDEN', 'CHECKBOX', 'NUMBER', 'DATE', 'RANGE'];
	inputs.forEach(function(t) {
		E[t] = makeInput(t);
	});
})();

/**
 Creates a cropped version of an image.
 Does the cropping by putting the image inside a DIV and using CSS
 to crop the image to the wanted rectangle.

 @param image The image element to crop.
 @param {int} x The left side of the crop box.
 @param {int} y The top side of the crop box.
 @param {int} w The width of the crop box.
 @param {int} h The height of the crop box.
 */
E.cropImage = function(image, x, y, w, h) {
	var i = image.cloneNode(false);
	E.css(i, {
		position: 'relative',
		left: -x + 'px',
		top : -y + 'px',
		margin: '0px',
		padding: '0px',
		border: '0px'
	});
	var e = E('div', {style: {
		display: 'block',
		width: w + 'px',
		height: h + 'px',
		overflow: 'hidden'
	}});
	e.appendChild(i);
	return e;
};

E.toArray = function(obj) {
	var a;
	if (obj.length !== undefined) {
		a = new Array(obj.length);
		for (var i=0; i<obj.length; i++) {
			a[i] = obj[i];
		}
	} else if (typeof obj === 'object') {
		a = [];
		for (var name in obj) {
			a.push({property: name, value: obj[name]});
		}
	} else {
		a = [obj];
	}
	return a;
};

(function() {
	// find vendor prefix and existing style properties 
	E.vendorPrefix = '';
	E.styleProperties = {};
	E.vendorProperties = {};
	var regex = /^(webkit|Moz|ms|O|Webkit|Khtml|Icab)([A-Z])/;
	var d = document.createElement('div');
	var found = false;
	for (var i in d.style) {
		E.styleProperties[i] = true;
		if (regex.test(i)) {
			if (!found) {
				E.vendorPrefix = i.match(regex)[0];
				found = true;
			}
			// cache vendor-prefixed property for fast access in E.css
			E.vendorProperties[i.replace(regex, function(s, p1, p2) { 
				return p2.toLowerCase();
			})] = i;
		}
	}
})();



E.css = function(elem, property, value) {
	if (value !== undefined) {
		if (E.styleProperties[property] || !E.vendorProperties[property]) {
			elem.style[property] = value;
		} else {
			elem.style[E.vendorProperties[property]] = value;
		}
	} else {
		for (var i in property) {
			E.css(elem, i, property[i]);
		}
	}
};

E.each = function(arrayOrObj, iterator, context_opt) {
	if (arrayOrObj instanceof Array) {
		for (var i=0; i<arrayOrObj.length; i++) {
			iterator.call(context_opt, arrayOrObj[i], i);
		}
	} else {
		iterator.call(context_opt, arrayOrObj, i);
	}
};

E.map = function(arrayOrObj, iterator, context_opt) {
	var res = [];
	if (arrayOrObj instanceof Array) {
		for (var i=0; i<arrayOrObj.length; i++) {
			res.push(iterator.call(context_opt, arrayOrObj[i]), i);
		}
	} else {
		res.push(iterator.call(context_opt, arrayOrObj, i));
	}
	return res;
};

E.on = function(elem, eventName, eventListener, bubble) {
	bubble = bubble || false;
	E.each(eventName, function(ev) {
		elem.addEventListener(ev, eventListener, bubble);
	});
	return eventListener;
};

E.off = function(elem, eventName, eventListener, bubble) {
	bubble = bubble || false;
	E.each(eventName, function(ev) {
		elem.removeEventListener(ev, eventListener, bubble);
	});
	return eventListener;
};

E.replace = function(elem, replacement) {
	elem.parentNode.insertBefore(replacement, elem);
	elem.parentNode.removeChild(elem);
};


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
( function () {
	var lastTime = 0;
	var vendors = [ '', 'ms', 'moz', 'webkit', 'o' ];
	for ( var x = 0; x < vendors.length && !E.requestAnimationFrame; ++ x ) {
		E.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
		E.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
	}

	if ( E.requestAnimationFrame === undefined ) {
		E.requestAnimationFrame = function ( callback ) {
			var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
			var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
			lastTime = currTime + timeToCall;
			return id;
		};
	}
	E.cancelAnimationFrame = E.cancelAnimationFrame || function ( id ) { window.clearTimeout( id ); };

	E.requestAnimationFrame = E.requestAnimationFrame.bind(window);
	E.cancelAnimationFrame = E.cancelAnimationFrame.bind(window);
}() );

E.sharedAnimationFrameCallbacks = [];
E.requestSharedAnimationFrame = function(callback) {
	if (E.sharedAnimationFrameCallbacks.length == 0) {
		E.requestAnimationFrame(E.onSharedAnimationFrame);
	}
	E.sharedAnimationFrameCallbacks.push(callback);
};

E.__currentSAFCBs = [];
E.onSharedAnimationFrame = function(t) {
	var a = E.__currentSAFCBs;
	var b = E.sharedAnimationFrameCallbacks;
	a.splice(b.length);
	for (var i=0; i<b.length; i++) {
		a[i] = b[i];
	}
	E.sharedAnimationFrameCallbacks.splice(0);
	for (i=0; i<a.length; i++) {
		a[i](t);
	}
};

E.sz = function(elem, w, h) {
	if (h == undefined) {
		if (w.style) {
			h = w.style.height || w.height;
			w = w.style.width || w.width;
		} else {
			h = w.height;
			w = w.width;
		}
	}
	if (typeof w === 'number') {
		w = w + 'px';
	}
	if (typeof h === 'number') {
		h = h + 'px';
	}
	elem.style.width = w;
	elem.style.height = h;
};

E.xy = function(elem, x, y) {
	if (y == undefined) {
		if (x.style) {
			y = x.style.height || x.height;
			x = x.style.width || x.width;
		} else {
			y = x.height;
			x = x.width;
		}
	}
	if (typeof x === 'number') {
		x = x + 'px';
	}
	if (typeof y === 'number') {
		y = y + 'px';
	}
	elem.style.left = x;
	elem.style.top = y;
};

E.remove = function(elem) {
	if (elem.parentNode) {
		elem.parentNode.removeChild(elem);
	}
};

E.extend = function(dst, src) {
	for (var i in src) {
		try{ dst[i] = src[i]; } catch(e) {}
	}
	return dst;
};

/**
 Merges the src object's attributes with the dst object, preserving all dst
 object's current attributes.

 @param dst The destination object
 @param src The source object
 @return The dst object
 @addon
 */
E.conditionalExtend = function(dst, src) {
	for (var i in src) {
		if (dst[i] === undefined) {
			dst[i] = src[i];
		}
	}
	return dst;
};

E.loadScript = function(src, id) { 
	if (E.id(id)) return;
	var js, fjs = E.tag('script')[0];
	js = E('script', {id: id, src: src});
	fjs.parentNode.insertBefore(js, fjs);
};

/**
 Creates and returns an Image object, with source URL set to src and
 onload handler set to onload.

 @param {String} src The source URL for the image
 @param {Function} onload The onload handler for the image
 @return The created Image object
 @type {Image}
 */
E.loadImage = function(src, onload) {
	var img = new Image();
	if (onload)
		img.onload = onload;
	img.src = src;
	return img;
};

/**
 Returns true if image is fully loaded and ready for use.

 @param image The image to check
 @return Whether the image is loaded or not
 @type {boolean}
 @addon
 */
E.isImageLoaded = function(image) {
	if (image.tagName == 'CANVAS') return true;
	if (image.tagName == 'VIDEO') return image.duration > 0;
	if (!image.complete) return false;
	if (image.naturalWidth != null && image.naturalWidth == 0) return false;
	if (image.width == null || image.width == 0) return false;
	return true;
};

E.clone = function(src) {
	if (src === false || src === true || src === null || src === undefined) {
		return src;
	}
	switch (typeof(src)) {
	case 'number':
		return src;
		break;
	case 'string':
		return E.extend(src+'', src);
		break;
	case 'function':
		var obj = eval(src.toSource());
		return E.extend(obj, src);
		break;
	case 'object':
		if (src instanceof Array) {
			return E.extend([], src);
		} else if (src instanceof Element) {
			return src.cloneNode(true);
		} else {
			return E.extend({}, src);
		}
		break;
	default:
		return src;
	}
};

E.defer = function(f) {
	setTimeout(f, 0);
};

E.deferStyle = function(elem, name, value) {
	E.defer(function() {
		E.css(elem, name, value);
	});
};

E.fadeOut = function(elem, duration, onComplete) {
	duration = duration || 500;
	E.css(elem, 'transition', (duration/1000)+'s');
	E.deferStyle(elem, 'opacity', 0);
	setTimeout(function() {
		if (onComplete) {
			onComplete.call(elem, elem);
		}
		elem.parentNode.removeChild(elem);
	}, duration);
	return elem;
};

E.fadeIn = function(elem, duration, onComplete, delay) {
	duration = duration || 500;
	delay = delay || 0;
	E.css(elem, 'transition', (duration/1000)+'s');
	E.css(elem, 'transition-delay', (delay/1000)+'s');
	elem.style.opacity = 0;
	E.deferStyle(elem, 'opacity', 1);
	setTimeout(function() {
		if (onComplete) {
			onComplete.call(elem, elem);
		}
	}, duration);
	return elem;
};

E.fadeInImage = function(src, rotation, jitter, onload) {
	var img = E('img');
	E.css(img, 'transition', '0.5s');
	E.css(img, 'opacity', 0);
	E.css(img, 'transform', 'rotate('+rotation+'deg) scale(1.2)');
	img.onload = function() {
		if (onload) {
			onload.call(img);
		}
		setTimeout((function() {
			E.css(this, 'opacity', 1);
			E.css(this, 'transform', 'rotate(0deg) scale(1)');
		}).bind(this), 10+Math.random()*(jitter || 200));
	};
	img.src = src;
	return img;
};

E.Mouse = {};
/**
 Returns the coordinates for a mouse event relative to element.
 Element must be the target for the event.

 @param element The element to compare against
 @param event The mouse event
 @return An object of form {x: relative_x, y: relative_y}
 */
E.Mouse.getRelativeCoords = function(element, event) {
	var xy = {x:0, y:0};
	if (element.getBoundingClientRect) {
		var r = element.getBoundingClientRect();
		xy.x = event.clientX - r.left;
		xy.y = event.clientY - r.top;
	} else {
		var osl = 0;
		var ost = 0;
		var el = element;
		while (el) {
			osl += el.offsetLeft;
			ost += el.offsetTop;
			el = el.offsetParent;
		}
		xy.x = event.pageX - osl;
		xy.y = event.pageY - ost;
	}
	return xy;
};

E.Browser = (function(){
	var ua = window.navigator.userAgent;
	var chrome = ua.match(/Chrome\/\d+/);
	var safari = ua.match(/Safari/);
	var mobile = ua.match(/Mobile/);
	var webkit = ua.match(/WebKit\/\d+/);
	var khtml = ua.match(/KHTML/);
	var gecko = ua.match(/Gecko/);
	var ie = ua.match(/Explorer/);
	if (chrome) return 'Chrome';
	if (mobile && safari) return 'Mobile Safari';
	if (safari) return 'Safari';
	if (webkit) return 'Webkit';
	if (khtml) return 'KHTML';
	if (gecko) return 'Gecko';
	if (ie) return 'IE';
	return 'UNKNOWN';
})();


E.Mouse.LEFT = 0;
E.Mouse.MIDDLE = 1;
E.Mouse.RIGHT = 2;

if (E.Browser == 'IE') {
	E.Mouse.LEFT = 1;
	E.Mouse.MIDDLE = 4;
}

E.Mouse.state = {};
window.addEventListener('mousedown', function(ev) {
	E.Mouse.state[ev.button] = true;
}, true);
window.addEventListener('mouseup', function(ev) {
	E.Mouse.state[ev.button] = false;
}, true);


E.Event = {
	cancel : function(event) {
		if (event.preventDefault) event.preventDefault();
	},

	stop : function(event) {
		Event.cancel(event);
		if (event.stopPropagation) event.stopPropagation();
	}
};


E.Key = {
	matchCode : function(event, code) {
		if (typeof code == 'string') {
			var codes = code.charCodeAt(0);
			var codeL = code.toLowerCase().charCodeAt(0);
			var codeU = code.toUpperCase().charCodeAt(0);
			return (
				event.which == codes ||
					event.which == codeL ||
					event.which == codeU ||
					event.keyCode == codes ||
					event.keyCode == codeL ||
					event.keyCode == codeU
			);
		} else {
			return (
				event.which == code ||
					event.keyCode == code
			);
		}
	},

	match : function(event, key) {
		for (var i=1; i<arguments.length; i++) {
			var arg = arguments[i];
			if (arg == null) continue;
			if (arg.length != null && typeof arg != 'string') {
				for (var j=0; j<arg.length; j++) {
					if (E.Key.matchCode(event, arg[j])) return true;
				}
			} else {
				if (E.Key.matchCode(event, arg)) return true;
			}
		}
		return false;
	},

	isNumber : function(event, key) {
		var k = event.which || event.keyCode || event.charCode;
		return k >= E.Key.N_0 && k <= E.Key.N_9;
	},

	number : function(event, key) {
		var k = event.which || event.keyCode || event.charCode;
		if (k < E.Key.N_0 || k > E.Key.N_9) return NaN;
		return k - E.Key.N_0;
	},

	getString : function(event) {
		var k = event.which || event.keyCode || event.charCode;
		return String.fromCharCode(k);
	},

	N_0: 48,
	N_1: 49,
	N_2: 50,
	N_3: 51,
	N_4: 52,
	N_5: 53,
	N_6: 54,
	N_7: 55,
	N_8: 56,
	N_9: 57,

	SHIFT: 16,
	CTRL: 17,
	ALT: 18,

	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	SPACE: 32,
	PAGE_UP: 33,
	PAGE_DOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	INSERT: 45,
	DELETE: 46
};


E.Query = {};
E.extend(E.Query, {
	parse : function(params) {
		var obj = {};
		if (!params) return obj;
		params.split("&").forEach(function(p){
			var kv = p.replace(/\+/g, " ").split("=").map(decodeURIComponent);
			obj[kv[0]] = kv[1];
		});
		return obj;
	},

	build : function(query) {
		if (typeof query == 'string') return encodeURIComponent(query);
		if (query instanceof Array) {
			a = query;
		} else {
			var a = [];
			for (var i in query) {
				if (query[i] != null) {
					a.push([i, query[i]]);
				}
			}
		}
		return a.map(function(p){ return p.map(encodeURIComponent).join("="); }).join("&");
	}
});

E.URL = {};
E.extend(E.URL, {
	build : function(base, params, fragment) {
		return base + (params != null ? '?'+E.Query.build(params) : '') +
			(fragment != null ? '#'+E.Query.build(fragment) : '');
	},

	parse : function(url) {
		if (url === undefined) {
			url = document.location.toString();
		}
		var gf = url.split("#");
		var gp = gf[0].split("?");
		var base = gp[0];
		var pr = base.split("://");
		var protocol = pr[0];
		var path = pr[1] || pr[0];
		return {
			base: base,
			path: path,
			protocol: protocol,
			query: E.Query.parse(gp[1]),
			fragment: gf[1],
			build: E.URL.__build__
		};
	},

	__build__ : function() {
		return E.URL.build(this.base, this.query, this.fragment);
	}

});

E.loadCSSButton = function(src, width, height, normal, hover, down) {
	var e = E('div', {style: {
		background: 'url('+src+')',
		display: 'inline-block',
		opacity: 0,
		width: width + 'px',
		height: height + 'px'
	}});
	var loader = E('img', {
		src: src,
		onload: function() {
			E.fadeIn(e);
		},
		onerror: function() {
			E.fadeOut(e);
		}
	});
	return E.CSSButton(e, normal, hover, down);
};

E.CSSButton = function(btn, normal, hover, down) {
	if (btn.CSSButtonEventListeners) {
		E.CSSButton.removeEventListeners(btn);
	}
	E.css(btn, 'backgroundRepeat', 'no-repeat');
	E.css(btn, 'cursor', 'pointer');
	var c = btn.CSSButtonEventListeners = {};
	c.showNormal = function() {
		if (this.eatWindowEvent) { 
			this.eatWindowEvent = false;
		} else {
			this.down = false;
			E.css(this, 'backgroundPosition', '0px '+(-normal)+'px');
		}
	};
	c.showDown = function() {
		this.down = E;
		this.css(this, 'backgroundPosition', '0px '+(-down)+'px');
	};
	c.showHover = function() {
		if (!this.down) { 
			E.css(this, 'backgroundPosition', '0px '+(-hover)+'px');
		}
	};
	c.showUp = function() {
		this.down = false;
		this.eatWindowEvent = true;
	};
	c.removed = function() {
		E.CSSButton.removeEventListeners(this);
	};
	c.windowMousemove = function(ev) { if (ev.target != this) { c.showNormal.call(this); } };
	c.windowBlur = function(ev) { c.showNormal.call(this); };
	btn.addEventListener('mouseup', c.showUp, false);
	btn.addEventListener('mouseout', c.showNormal, false);
	btn.addEventListener('mouseover', c.showHover, false);
	btn.addEventListener('mousedown', c.showDown, false);
	btn.addEventListener('DOMNodeRemovedFromDocument', c.removed, false);
	E.onDocument.add(btn, 'mousemove', c.windowMousemove, false);
	E.onDocument.add(btn, 'blur', c.windowBlur, false);
	E.onDocument.add(btn, 'mouseup', c.showNormal, false);
	c.showNormal.call(btn);
	return btn;
};

E.CSSButton.removeEventListeners = function(btn) {
	var c = btn.CSSButtonEventListeners;
	if (!c) {
		return;
	}
	btn.removeEventListener('mouseup', c.showUp, false);
	btn.removeEventListener('mouseout', c.showNormal, false);
	btn.removeEventListener('mouseover', c.showHover, false);
	btn.removeEventListener('mousedown', c.showDown, false);
	btn.removeEventListener('DOMNodeRemovedFromDocument', c.removed, false);
	E.onDocument.remove(btn, 'mousemove', c.windowMousemove, false);
	E.onDocument.remove(btn, 'blur', c.windowBlur, false);
	E.onDocument.remove(btn, 'mouseup', c.showNormal, false);
};

E.Listener = function(object) {
	this.listeners = {};
	this.object = object;
};

E.Listener.prototype = {
	add: function(context, eventName, callback, bubble) {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = {'true': [], 'false': []};
		}
		if (this.listeners[eventName][bubble].length === 0) {
			this.listeners[eventName][bubble].listener = (function(evt) {
				var a = this.listeners[eventName][bubble];
				for (var i=0; i<a.length; i++) {
					var el = a[i];
					if (el.context && !el.context.parentNode) {
						a.splice(i, 1);
						i--;
					} else {
						var ok = el.callback.call(el.context || this.object, evt);
						if (ok === false) {
							return false;
						}
					}
				}
				return true;
			}).bind(this);
			this.object.addEventListener(eventName, this.listeners[eventName][bubble].listener, bubble);
		}
		this.listeners[eventName][bubble].push({context: context, callback: callback});
	},

	remove: function(context, eventName, callback, bubble) {
		if (this.listeners[eventName]) {
			var b = this.listeners[eventName][bubble];
			for (var i=0; i<b.length; i++) {
				if (b[i].context === context && b[i].callback === callback) {
					b.splice(i, 1);
					break;
				}
			}
			if (b.length === 0) {
				this.object.removeEventListener(eventName, b.listener, bubble);
				delete b.listener;
			}
		}
	}
};

E.onDocument = new E.Listener(document);
E.onWindow = new E.Listener(window);


E.Spinner = {
	create : function(container, duration, opts) {
		var color, size, left, top, lineWidth;
		if (opts != undefined) {
			color = opts.color;
			size = opts.size;
			left = opts.left;
			top = opts.top;
			lineWidth = opts.lineWidth;
		}
		if (color == undefined) { color = '#000000'; }
		if (size == undefined) { size = 50; }
		var halfSize = size / 2;
		if (left == undefined) { left = '50%'; }
		if (top == undefined) { top = '50%'; }
		if (lineWidth == undefined) { lineWidth = 4; }
		var spinner = E('div');
		spinner.lineWidth = lineWidth;
		spinner.color = color;
		spinner.className = 'spinner-bringIn';
		spinner.scale = 0.0;
		spinner.startTime = 0;
		spinner.style.position = 'absolute';
		spinner.style.marginLeft = -halfSize + 'px';
		spinner.style.marginTop = -halfSize + 'px';
		spinner.style.left = left;
		spinner.style.top = top;
		spinner.duration = duration || 1000;
		var canvas = E('canvas');
		canvas.className = 'spinner';
		canvas.width = canvas.height = size;
		spinner.canvas = canvas;
		spinner.appendChild(canvas);
		spinner.tick = this.tick.bind(spinner);
		spinner.exit = false;
		spinner.enter = true;
		container.appendChild(spinner);
		spinner.tick();
		return spinner;
	},

	tick : function() {
		var t = Date.now();
		this.startTime = this.startTime || t;
		var elapsed = t - this.startTime;
		if (this.exit) {
			this.scale = Math.max(0, Math.min(1, 1-(elapsed/this.duration)));
			this.scale = 0.5 - 0.5 * Math.cos(this.scale*Math.PI);
			if (this.scale <= 0.01) {
				this.parentNode.removeChild(this);
				if (this.callback) {
					this.callback();
				}
				return;
			}
		} else if (this.enter) {
			this.scale = Math.max(0, Math.min(1, (elapsed/this.duration)));
			this.scale = 0.5 - 0.5 * Math.cos(this.scale*Math.PI);
		}
		var scale = this.scale;
		var canvas = this.canvas;
		var ctx = canvas.getContext('2d');
		var w = canvas.width;
		var h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		ctx.save();
		{
			ctx.globalAlpha = scale;
			ctx.strokeStyle = this.color;
			ctx.translate(w/2, h/2);
			ctx.scale(scale, scale);
			ctx.rotate((t / 300) % (Math.PI*2));
			ctx.lineWidth = this.lineWidth;
			ctx.lineCap = 'round';
			var third = Math.PI*2 / 3;
			for (var i=0; i<3; i++) {
				ctx.beginPath();
				ctx.arc(0, 0, w*0.4, i*third, i*third+Math.PI/2, false);
				ctx.stroke();
			}
		}
		ctx.restore();
		E.requestSharedAnimationFrame(this.tick);
	},

	remove : function(spinner, callback) {
		spinner.className = 'spinner-bringOut';
		spinner.exit = true;
		spinner.enter = false;
		spinner.startTime = 0;
		spinner.callback = callback;
	},

	loadImageElem : function(img, onload) {
		var t0, spinner;
		var imgCont = E('span');
		E.css(img, 'opacity', 0);
		E.css(img, 'transition', '0.25s');
		window.setTimeout(function() {
			if (img.complete) {
				img.onload();
			} else {
				E.sz(imgCont, img);
				E.xy(imgCont, img.offsetLeft, img.offsetTop);
				imgCont.style.display = 'inline-block';
				imgCont.style.position = 'absolute';
				imgCont.style.overflow = 'hidden';
				var p = img.parentNode;
				if (p) {
					p.insertBefore(imgCont, img);
				}
				spinner = E.Spinner.create(imgCont, 250);
				t0 = Date.now();
			}
		}, 50);
		var fired = false;
		img.loaded = function() {
			if (fired) {
				return;
			}
			fired = true;
			E.css(img, 'opacity', 1);
			E.remove(imgCont);
			if (onload) {
				onload.call(img, imgCont);
			}
		};
		img.onload = function() {
			if (spinner) {
				var elapsed = Date.now() - t0;
				window.setTimeout(function() {
					E.Spinner.remove(spinner, img.loaded);
				}, Math.max(0, 250-elapsed));
			} else {
				img.loaded();
			}
		};
		img.onerror = function() {
			var elapsed = Date.now() - t0;
			window.setTimeout(function() {
				E.Spinner.remove(spinner, function() {
					E.remove(imgCont);
				});
			}, Math.max(0, 250-elapsed));
		};
		if (img.complete) {
			img.onload();
		}
		return imgCont;
	},

	loadImage : function(src, w, h, onload) {
		var img = E('img');
		img.width = w;
		img.height = h;
		img.src = src;
		return E.Spinner.loadImageElem(img, onload);
	},

	loadAllImages: function() {
		var imgs = E.toArray(E.tag('img'));
		for (var i=0; i<imgs.length; i++) {
			var img = imgs[i];
			E.Spinner.loadImageElem(img);
		}
	}
};


if (typeof mat4 !== 'undefined') {
	E.CSSMatrix = (window.WebKitCSSMatrix || window.CSSMatrix || function() {
		this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
		this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
		this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
		this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
		this.js = true;

		this.toString = function() {
			return ("matrix3d(" + 
				this.m11 + "," +
				this.m12 + "," +
				this.m13 + "," +
				this.m14 + "," +
				this.m21 + "," +
				this.m22 + "," +
				this.m23 + "," +
				this.m24 + "," +
				this.m31 + "," +
				this.m32 + "," +
				this.m33 + "," +
				this.m34 + "," +
				this.m41 + "," +
				this.m42 + "," +
				this.m43 + "," +
				this.m44 + ")");
		};
	});
	E.CSS = {
		mat4ToTransform : function(mat, dst) {
			dst.m11 = mat[0];
			dst.m12 = mat[1];
			dst.m13 = mat[2];
			dst.m14 = mat[3];
			dst.m21 = mat[4];
			dst.m22 = mat[5];
			dst.m23 = mat[6];
			dst.m24 = mat[7];
			dst.m31 = mat[8];
			dst.m32 = mat[9];
			dst.m33 = mat[10];
			dst.m34 = mat[11];
			dst.m41 = mat[12];
			dst.m42 = mat[13];
			dst.m43 = mat[14];
			dst.m44 = mat[15];
			if (dst.js) {
				return dst.toString();
			}
			return dst;
		},
		
		setPerspective : function(p) {
			E.css(this, 'perspective', (typeof p === 'number') ? (p) : p);
		},
		
		setOrigin : function(x, y) {
			E.css(this, 'transformOrigin', x + ' ' + y);
		},
		
		setTransform : function(matrix) {
			if (!this.cssMatrix) {
				E.css(this, 'transformStyle', 'preserve-3d');
				this.cssMatrix = new E.CSSMatrix();
			}
			E.css(this, 'transform', this.mat4ToTransform(matrix, this.cssMatrix));
			this.matrix = matrix;
		},

		setSz : function(w, h) {
			this.style.width = w + 'px';
			this.style.height = h + 'px';
		},
		
		setMinSz : function(w, h) {
			this.style.minWidth = w + 'px';
			this.style.minHeight = h + 'px';
		},
		
		setBg : function(color) {
			if (typeof color === 'string') {
				if (/^\.[a-z_-]+$/.test(color)) {
					this.classList.add(color.substring(1));
				} else {
					this.style.background = color;
				}
			} else {
				this.style.background = E.ColorUtils.colorToStyle(color);
			}
		},

		setColor : function(color) {
			if (typeof color == 'string') {
				this.style.color = color;
			} else {
				this.style.color = E.ColorUtils.colorToStyle(color);
			}
		},
		
		setFont : function(font) {
			this.style.font = font;
		},
		
		setAlign : function(align) {
			this.style.textAlign = align;
		},
		
		update : function() {
			var m = this.matrix || mat4.identity();
			var deform = 0;
			if (this.gravity) {
				var floor = this.floorLevel || 0;
				deform = Math.max(0, this.velocity[1]+this.position[1]-floor) / 200;
				this.velocity[1] += 1.7;
				this.scale[1] = 1-deform;
				this.scale[0] = this.scale[2] = 1+deform/2;
				if (this.position[1] >= floor && this.velocity[1] > 0) {
					this.velocity[1] *= -0.6;
					if (Math.abs(this.velocity[1]) < 4) {
						this.velocity[1] = 0;
						this.position[1] = floor;
						vec3.scale(this.velocity, 0.99);
					} else {
						vec3.negate(this.rotV);
					}
				}
			}
			vec3.add(this.position, this.velocity);
			vec3.add(this.rotation, this.rotV);
			mat4.identity(m);
			mat4.translate(m, this.position);
			if (deform > 0) {
				mat4.translate(m, vec3.create(-200*deform/4, 200*deform/2, -200*deform/4));
			}
			mat4.scale(m, this.scale);
			mat4.rotateX(m, this.rotation[0]);
			mat4.rotateY(m, this.rotation[1]);
			mat4.rotateZ(m, this.rotation[2]);
			this.setTransform(m);
		}

	};

	E.D3 = function(){
		var div = E.DIV.apply(null, arguments);
		this.gravity = true;
		div.style.position = 'absolute';
		div.style.left = div.style.top = '0px';
		E.extend(div, E.CSS);
		div.velocity = vec3.create(0,0,0);
		div.rotV = vec3.create(0,0,0);
		div.position = vec3.create(0,0,0);
		div.rotation = vec3.create(0,0,0);
		div.scale = vec3.create(1,1,1);
		return div;
	};

	E.TEX = function(bg, backface) {
		var d = E.D3();
		d.style.width = d.style.height = '100%';
		d.setBg(bg);
		E.css(d, 'backfaceVisibility', backface ? 'visible' : 'hidden');
		return d;
	};

	E.makeQuad = function(w, h, outsideBackground, insideBackground) {
		var quad = E.D3();
		quad.setSz(w, h);
		quad.style.left = -w/2 + 'px';
		quad.style.top = -h/2 + 'px';
		if (insideBackground == null) {
			quad.setBg(outsideBackground);
			return quad;
		}
		var outside = E.TEX(outsideBackground);
		var inside = E.TEX(insideBackground);
		outside.setTransform(mat4.rotateY(mat4.identity(), Math.PI));
		inside.setTransform(mat4.identity());
		quad.appendChild(outside);
		quad.appendChild(inside);
		return quad;
	};
}

Math.clamp = function(v, min, max) {
	return Math.min(max, Math.max(min, v));
};

E.ColorUtils = {

	colorToStyle : function(c) {
		return (
			'rgba('+Math.floor(c[0]*255)+
				','+Math.floor(c[1]*255)+
				','+Math.floor(c[2]*255)+
				','+c[3]+')'
		);
	},

	colorToHex : function(c, noHash) {
		var r = Math.floor(255*Math.clamp(c[0], 0, 1));
		var g = Math.floor(255*Math.clamp(c[1], 0, 1));
		var b = Math.floor(255*Math.clamp(c[2], 0, 1));
		return [
			noHash ? '' : '#',
			r<16 ? '0' : '', r.toString(16),
			g<16 ? '0' : '', g.toString(16),
			b<16 ? '0' : '', b.toString(16)
		].join('');
	},

	styleToColor : function(c) {
		var r=0,g=0,b=0,a=0;
		if (/^#/.test(c)) {
			r = parseInt(c.substring(1,3), 16) / 255;
			g = parseInt(c.substring(3,5), 16) / 255;
			b = parseInt(c.substring(5,7), 16) / 255;
			a = 1;
			if (c.length == 9)
				a = parseInt(c.substring(7,9), 16) / 255;
		} else if (/^rgba/.test(c)) {
			rgba = c.substring(5,c.length-1).split(",").map(parseFloat);
			r = rgba[0] / 255;
			g = rgba[1] / 255;
			b = rgba[2] / 255;
			a = rgba[3];
		} else if (/^rgb/.test(c)) {
			rgb = c.substring(4,c.length-1).split(",").map(parseFloat);
			r = rgb[0] / 255;
			g = rgb[1] / 255;
			b = rgb[2] / 255;
			a = 1.0;
		}
		return this.colorVec(r,g,b,a);
	},

	tween : function(a, b, f, dst) {
		var r = dst == null ? new this.colorVecType(a.length) : dst;
		for (var i=0; i<a.length; i++) {
			r[i] = a[i]*(1-f) + b[i]*f;
		}
		return r;
	},

	tweenColor : function(a, b, f, dst) {
		var c = this.tween(a,b,f, dst);
		return this.colorToStyle(c);
	},

	averageColor : function(imageData, dst) {
		var d = imageData.data;
		var r=0, g=0, b=0, a=0;
		for (var i=-1, dl=d.length-1; i<dl;) {
			r += d[++i];
			g += d[++i];
			b += d[++i];
			a += d[++i];
		}
		var l = d.length / 4;
		return this.colorVec( r/l, g/l, b/l, a/l, dst );
	},

	colorAt : function(ctx, x, y, radius, dst) {
		radius = radius || 1;
		var id = ctx.getImageData(x-(radius-1), y-(radius-1), 2*radius-1, 2*radius-1);
		var c = this.averageColor(id, dst);
		c[0] /= 255;
		c[1] /= 255;
		c[2] /= 255;
		c[3] /= 255;
		return c;
	},

	colorVecType : (typeof Float32Array == 'undefined' ? Array : Float32Array),

	colorVec : function(r,g,b,a,dst) {
		if (dst == null)
			dst = new this.colorVecType(4);
		dst[0]=r; dst[1]=g; dst[2]=b; dst[3]=a;
		return dst;
	},

	/**
     Converts an HSL color to its corresponding RGB color.

     @param h Hue in degrees [0 .. 360]
     @param s Saturation [0.0 .. 1.0]
     @param l Lightness [0.0 .. 1.0]
     @param dst Optional array to write the color into.
     @return The corresponding RGB color as [r,g,b]
     @type Array
     */
	hsl2rgb : function(h,s,l,dst) {
		var r,g,b;
		if (s == 0) {
			r=g=b=l;
		} else {
			var q = (l < 0.5 ? l * (1+s) : l+s-(l*s));
			var p = 2 * l - q;
			var hk = (h % 360) / 360;
			var tr = hk + 1/3;
			var tg = hk;
			var tb = hk - 1/3;
			if (tr < 0) tr++;
			if (tr > 1) tr--;
			if (tg < 0) tg++;
			if (tg > 1) tg--;
			if (tb < 0) tb++;
			if (tb > 1) tb--;
			if (tr < 1/6)
				r = p + ((q-p)*6*tr);
			else if (tr < 1/2)
				r = q;
			else if (tr < 2/3)
				r = p + ((q-p)*6*(2/3 - tr));
			else
				r = p;

			if (tg < 1/6)
				g = p + ((q-p)*6*tg);
			else if (tg < 1/2)
				g = q;
			else if (tg < 2/3)
				g = p + ((q-p)*6*(2/3 - tg));
			else
				g = p;

			if (tb < 1/6)
				b = p + ((q-p)*6*tb);
			else if (tb < 1/2)
				b = q;
			else if (tb < 2/3)
				b = p + ((q-p)*6*(2/3 - tb));
			else
				b = p;
		}
		return this.colorVec(r,g,b,1,dst);
	},

	/**
     Converts an HSV color to its corresponding RGB color.

     @param h Hue in degrees [0 .. 360]
     @param s Saturation [0.0 .. 1.0]
     @param v Value [0 .. 1.0]
     @return The corresponding RGB color as [r,g,b]
     @type Array
     */
	hsv2rgb : function(h,s,v,dst) {
		var r,g,b;
		if (s == 0) {
			r=g=b=v;
		} else {
			h = (h % 360)/60.0;
			var i = Math.floor(h);
			var f = h-i;
			var p = v * (1-s);
			var q = v * (1-s*f);
			var t = v * (1-s*(1-f));
			switch (i) {
			case 0:
				r = v;
				g = t;
				b = p;
				break;
			case 1:
				r = q;
				g = v;
				b = p;
				break;
			case 2:
				r = p;
				g = v;
				b = t;
				break;
			case 3:
				r = p;
				g = q;
				b = v;
				break;
			case 4:
				r = t;
				g = p;
				b = v;
				break;
			case 5:
				r = v;
				g = p;
				b = q;
				break;
			}
		}
		return this.colorVec(r,g,b,1,dst);
	},

	hsva2rgba : function(h,s,v,a,dst) {
		var rgb = this.hsv2rgb(h,s,v,dst);
		rgb[3] = a;
		return rgb;
	},

	rgb2cmy : function(r,g,b,dst) {
		return this.colorVec(1-r, 1-g, 1-b, 1, dst);
	},

	cmy2rgb : function(c,m,y,dst) {
		return this.colorVec(1-c, 1-m, 1-y, 1, dst);
	},

	rgba2cmya : function(r,g,b,a,dst) {
		return this.colorVec(1-r, 1-g, 1-b, a, dst);
	},

	cmya2rgba : function(c,m,y,a,dst) {
		return this.colorVec(1-c, 1-m, 1-y, a, dst);
	},

	cmy2cmyk : function(c,m,y,dst) {
		var k = Math.min(c,m,y);
		if (k == 1)
			return this.colorVec(0,0,0,1,dst);
		var k1 = 1-k;
		return this.colorVec((c-k)/k1, (m-k)/k1, (y-k)/k1, k,dst);
	},

	cmyk2cmy : function(c,m,y,k,dst) {
		var k1 = 1-k;
		return this.colorVec(c*k1+k, m*k1+k, y*k1+k, 1, dst);
	},

	cmyk2rgb : function(c,m,y,k,dst) {
		var cmy = this.cmyk2cmy(c,m,y,k,dst);
		return this.cmy2rgb(cmy[0], cmy[1], cmy[2], cmy);
	},

	rgb2cmyk : function(r,g,b,dst) {
		var cmy = this.rgb2cmy(r,g,b,dst);
		return this.cmy2cmyk(cmy[0], cmy[1], cmy[2], cmy);
	},

	rgba2hsva : function(r,g,b,a,dst) {
		var h=0,s=0,v=0;
		var mini = Math.min(r,g,b);
		var maxi = Math.max(r,g,b);
		v=maxi;
		var delta = maxi-mini;
		if (maxi > 0) {
			s = delta/maxi;
			if (delta == 0)
				h = 0;
			else if (r == maxi)
				h = (g-b)/delta;
			else if (g == maxi)
				h = 2+(b-r)/delta;
			else
				h = 4+(r-g)/delta;
			h *= 60;
			if (h < 0)
				h += 360;
		}
		return this.colorVec(h,s,v,a,dst);
	},

	rgb2hsv : function(r,g,b,dst) {
		return this.rgba2hsva(r,g,b,1,dst);
	}
};

if (typeof mat3 !== 'undefined') {
	E.extend(E.ColorUtils, {
		rgb2yiqMatrix : mat3.create([
			0.299, 0.587, 0.114,
			0.596, -0.275, -0.321,
			0.212, -0.523, 0.311
		]),
		rgba2yiqa : function(r,g,b,a,dst) {
			return mat3.multiplyVec3(this.rgb2yiqMatrix, this.colorVec(r,g,b,a,dst));
		},

		rgb2yiq : function(r,g,b,dst) {
			return this.rgba2yiqa(r,g,b,1,dst);
		},

		yiq2rgbMatrix : mat3.create([
			1, 0.956, 0.621,
			1, -0.272, -0.647,
			1, -1.105, 1.702
		]),
		yiqa2rgba : function(y,i,q,a,dst) {
			return mat3.multiplyVec3(this.yiq2rgbMatrix, this.colorVec(y,i,q,a,dst));
		},

		yiq2rgb : function(y,i,q,dst) {
			return this.yiqa2rgba(y,i,q,1,dst);
		},

		rgb2xyzMatrix : mat3.create([
			3.240479, -1.537150, -0.498535,
				-0.969256, 1.875992, 0.041556,
			0.055648, -0.204043, 1.057311
		]),
		rgba2xyza : function(r,g,b,a,dst) {
			return mat3.multiplyVec3(this.rgba2xyzaMatrix, this.colorVec(r,g,b,a,dst));
		},
		rgb2xyz : function(r,g,b,dst) {
			return this.rgba2xyza(r,g,b,1,dst);
		},

		xyz2rgbMatrix : mat3.create([
			0.412453, 0.357580, 0.180423,
			0.212671, 0.715160, 0.072169,
			0.019334, 0.119193, 0.950227
		]),
		xyza2rgba : function(x,y,z,a,dst) {
			return mat3.multiplyVec3(this.xyz2rgbMatrix, this.colorVec(x,y,z,a,dst));
		},
		xyz2rgb : function(x,y,z,dst) {
			return this.xyza2rgba(x,y,z,1,dst);
		},

		laba2xyza : function(l,a,b,xn,yn,zn,alpha,dst) {
			var p = (l + 16.0) / 116.0;
			return this.colorVec(
				xn * Math.pow(p + a / 500.0, 3),
				yn * p*p*p,
				zn * Math.pow(p - b / 200.0, 3),
				alpha, dst
			);
		},
		lab2xyz : function(l,a,b,xn,yn,zn,dst) {
			return this.laba2xyza(l,a,b,xn,yn,zn,1,dst);
		},
		xyza2laba : function(x,y,z,xn,yn,zn,a,dst) {
			var f = function(t) {
				return (t > 0.008856) ? Math.pow(t,(1.0/3.0)) : (7.787 * t + 16.0/116.0);
			};
			return this.colorVec(
				((y/yn > 0.008856) ? 116.0 * Math.pow(y/yn, 1.0/3.0) - 16.0 : 903.3 * y/yn),
				500.0 * ( f(x/xn) - f(y/yn) ),
				200.0 * ( f(y/yn) - f(z/zn) ),
				a, dst
			);
		},
		xyz2lab : function(x,y,z,xn,yn,zn,dst) {
			return this.xyza2laba(x,y,z,xn,yn,zn,1,dst);
		},

		laba2rgba : function(l,a,b,xn,yn,zn,A,dst) {
			var xyza = this.laba2xyza(l,a,b,xn,yn,zn,A,dst);
			return this.xyza2rgba(xyza[0], xyza[1], xyza[2], xyza[3], xyza);
		},
		lab2rgb : function(l,a,b,xn,yn,zn,dst) {
			return this.laba2rgba(l,a,b,xn,yn,zn,1,dst);
		},

		rgba2laba : function(r,g,b,a,xn,yn,zn,dst) {
			var xyza = this.rgba2xyza(r,g,b,a,dst);
			return this.xyza2laba(xyza[0], xyza[1], xyza[2], xn,yn,zn, xyza[3], xyza);
		},
		rgb2lab : function(r,g,b,xn,yn,zn,dst) {
			return this.rgba2labal(r,g,b,xn,yn,zn,1,dst);
		},

		rgb2yuvMatrix : mat3.create([
			0.299, 0.587, 0.144,
				-0.159, -0.332, 0.050,
			0.500, -0.419, -0.081
		]),
		rgba2yuva : function(r,g,b,a,dst) {
			return mat3.multiplyVec3(this.rgb2yuvMatrix, this.colorVec(r,g,b,a,dst));
		},
		rgb2yuv : function(r,g,b,dst) {
			return this.rgba2yuva(r,g,b,1,dst);
		},

		yuva2rgba : function(y,u,v,a,dst) {
			return this.colorVec(
				y + (1.4075 * (v - 128)),
				y - (0.3455 * (u - 128) - (0.7169 * (v - 128))),
				y + (1.7790 * (u - 128)),
				a, dst
			);
		},
		yuv2rgb : function(y,u,v,dst) {
			return this.yuva2rgba(y,u,v,1,dst);
		}

	});
}





