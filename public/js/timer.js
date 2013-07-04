"use strict";

var Timer = function() {
	this._elapsed = 0;
	this._startTime = null;
};

Timer.prototype.isRunning = function() {
	return this._startTime !== null;
};

Timer.prototype.start = function() {
	if (!this.isRunning()) {
		this._startTime = Date.now();
	}
};

Timer.prototype.stop = function() {
	if (this.isRunning()) {
		this._elapsed += Date.now() - this._startTime;
		this._startTime = null;
	}
};

Timer.prototype.reset = function() {
	this._elapsed = 0;
	if (this.isRunning()) {
		this.start();
	}
};

Timer.prototype.getTime = function() {
	if (this.isRunning()) {
		return this._elapsed + (Date.now() - this._startTime);
	} else {
		return this._elapsed;
	}
};

Timer.prototype.toString = function() {
	var t = this.getTime();
	var sec = Math.floor(t / 1000) % 60;
	var min = Math.floor(t / (60*1000)) % 60;
	var hour = Math.floor(t / (60*60*1000));
	var str = (
		(hour > 1 ? hour+':' : '') +
		(min > 9 ? '' : '0')+min+':' +
		(sec > 9 ? '' : '0')+sec
	);
	return str;
};

