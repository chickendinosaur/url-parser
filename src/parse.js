/**
@license
The MIT License (MIT)

Copyright (c) 2016 John Pittman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

function Url() {
	this.protocol = null; // http:
	this.slashes = false;
	this.auth = null; // username=password
	this.host = null; // subdomain.domain.com:port
	this.port = null; // 80
	this.hostname = null;
	this.hash = null; // someplace
	this.search = null; // ?item=1&name=joe#someplace
	this.query = null; // item=1&name=joe#someplace
	this.pathname = null; // /a/b/c/
	this.params = null; // []
	this.path = null;
	this.href = null; // http://username:password@subdomain.domain.com:port/a/b/c/d/?item=1&name=joe#someplace
}

function HostURL() {
	this.protocol = null; // http:
	this.auth = null; // username=password
	this.host = null; // subdomain.domain.com:port
	this.port = null; // 80
	this.hostname = null;
}

var lastHostURL = '';
var lastHostURLObj = new HostURL();

module.exports = function (url, parseQueryString) {
	var urlObj = new Url();

	// Need to find the path and separate the path from the host name first
	// to avoid any conflicts with obscure characters existing in parts of the path
	// or query that are seperation keys for parts of the hostname,
	var pathStartIndex = url.indexOf('/');

	if (
		pathStartIndex > 0 &&
		url.charAt(pathStartIndex - 1) === ':'
	) {
		urlObj.slashes = true;
		pathStartIndex = url.indexOf('/', pathStartIndex + 2);
	} else if (pathStartIndex === 0 &&
		url.charAt(1) === '/') {
		urlObj.slashes = true;
		pathStartIndex = url.indexOf('/', 3);
	}

	// If no path was found the set the host end index.
	if (pathStartIndex < 0) {
		pathStartIndex = url.length;
	}

	/*
	Left-side
	*/

	// Full host path including protocol, auth, and port.
	var leftPath = url.substring(0, pathStartIndex);

	// Parse left side of the url.
	// Host side.
	if (leftPath.length > 0) {
		// Check cached for host.
		if (lastHostURL === leftPath) {
			urlObj.protocol = lastHostURLObj.protocol;
			urlObj.auth = lastHostURLObj.auth;
			urlObj.host = lastHostURLObj.host;
			urlObj.port = lastHostURLObj.port;
			urlObj.hostname = lastHostURLObj.hostname;
		} else {
			// Get initial end index.
			var protocolEndIndex = leftPath.indexOf(':');

			// Has protocol.
			if (protocolEndIndex >= 0) {
				urlObj.protocol = leftPath.substring(0, protocolEndIndex + 1);

				// Increment current index cursor to index after protocol syntax.
				if (leftPath.charAt(protocolEndIndex + 1) === '/') {
					protocolEndIndex += 3;
				} else {
					protocolEndIndex += 1;
				}

				// Auth
				// Only auth if there's a protocol which is why it's inside protocol check.
				var authEndIndex = url.indexOf('@', protocolEndIndex);
				if (authEndIndex >= 0) {
					urlObj.auth = leftPath.substring(protocolEndIndex, authEndIndex);
					protocolEndIndex = authEndIndex + 1;
				}
			} else {
				protocolEndIndex = 0;
			}

			// Host.
			urlObj.host = leftPath.substring(protocolEndIndex, pathStartIndex);
			var portStartIndex = leftPath.indexOf(':', protocolEndIndex);
			if (portStartIndex >= 0) {
				urlObj.port = leftPath.substring(portStartIndex + 1);
			}

			urlObj.hostname = leftPath.substring(protocolEndIndex, portStartIndex >= 0 ? portStartIndex : leftPath.length);

			// Update host url cache.
			lastHostURL = leftPath;
			lastHostURLObj.protocol = urlObj.protocol;
			lastHostURLObj.auth = urlObj.auth;
			lastHostURLObj.host = urlObj.host;
			lastHostURLObj.port = urlObj.port;
			lastHostURLObj.hostname = urlObj.hostname;
		}
	}

	/*
	Right-side
	*/

	// Full path including path, query, and hash.
	var rightPath = url.substring(pathStartIndex);

	// Parse right side of the url.
	// Path side.
	// Hash.
	var hashIndex = rightPath.indexOf('#');
	if (hashIndex >= 0) {
		urlObj.hash = rightPath.substring(hashIndex);
		rightPath = rightPath.substring(0, hashIndex);
	}

	// Search.
	// Query.
	var queryIndex = rightPath.indexOf('?');
	if (queryIndex >= 0) {
		var query = rightPath.substring(queryIndex + 1);
		var queryLen = query.length;
		urlObj.search = '?' + query;

		// Parse query string.
		// Build params object.
		if (parseQueryString === true &&
			queryLen > 0) {
			var queryParams = {};
			var queryIndexIter = 0;
			var currPropChar = '';
			var propQueue = '';
			var currPropName;

			while (queryIndexIter < queryLen) {
				currPropChar = query.charAt(queryIndexIter);

				if (currPropChar !== '=' &&
					currPropChar !== '&') {
					propQueue += currPropChar;
				}

				if (currPropChar === '=') {
					currPropName = propQueue;
					propQueue = '';
				} else if (
					currPropChar === '&' ||
					queryIndexIter === queryLen - 1
				) {
					queryParams[currPropName] = propQueue;
					propQueue = '';
				}

				++queryIndexIter;
			}

			urlObj.query = queryParams;
		} else {
			// Store query string as normal.
			urlObj.query = query;
		}
	}

	// Pathname.
	if (queryIndex >= 0) {
		urlObj.pathname = rightPath.substring(0, queryIndex);
	} else {
		urlObj.pathname = rightPath.substring(0);
	}

	// Path
	urlObj.path = urlObj.pathname + urlObj.search || '';

	urlObj.href = url;

	return urlObj;
};