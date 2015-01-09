/**
 * @project Dependency Visualizer
 * Visualize dependencies in your code.
 * @file app.js
 * Presentation server.
 * @author curtiszimmerman
 * @contact software@curtisz.com
 * @license AGPLv3
 * @version 0.0.1
 */

var __http = (function() {
	var http = require('http');
	var yargs = require('yargs');

	var worker = require('./lib/worker.js');

	var $data = {
		database: {
			settings: {
				active: false
			}
		},
		server: {
			settings: {
				argv: null,
				port: 4488
			}
		}
	};

	/**
	 * @function _log
	 * Exposes logging functions.
	 * @method debug
	 * Log a debug message if debugging is on.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method error
	 * Log an error.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method info
	 * Log an informational message.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 * @method log
	 * Log a message.
	 * @param (string) data - The data to log.
	 * @param (integer) [loglevel] - Loglevel of data. Default 1.
	 * @return (boolean) Success indicator.
	 * @method warn
	 * Log a warning.
	 * @param (string) data - The data to log.
	 * @return (boolean) Success indicator.
	 */
	var _log = (function() {
		var _con = function( data, loglevel ) {
			var pre = ['[!] ERROR: ', '[+] ', '[i] WARN: ', '[i] INFO: ', '[i] DEBUG: '];
			return console.log(pre[loglevel]+data);
		};
		var _debug = function( data ) { return _con(data, 4);};
		var _error = function( data ) { return _con(data, 0);};
		var _info = function( data ) { return _con(data, 3);};
		var _log = function( data, loglevel ) {
			var loglevel = typeof(loglevel) === 'undefined' ? 1 : loglevel > 4 ? 4 : loglevel;
			return $data.server.state.logs.quiet ? loglevel === 0 && _con(data, 0) : loglevel <= $data.server.state.logs.level && _con(data, loglevel);
		};
		var _warn = function( data ) { return _con(data, 2);};
		return {
			debug: _debug,
			error: _error,
			info: _info,
			log: _log,
			warn: _warn
		};
	})();

	/*\
	|*| pub/sub/unsub pattern utility closure
	\*/
	var _pubsub = (function() {
		var cache = {};
		function _flush() {
			cache = {};
		};
		function _pub( topic, args, scope ) {
			if (cache[topic]) {
				var currentTopic = cache[topic],
					topicLength = currentTopic.length;
				for (var i=0; i<topicLength; i++) {
					currentTopic[i].apply(scope || this, args || []);
				}
			}
			return true;
		};
		function _sub( topic, callback ) {
			if (!cache[topic]) {
				cache[topic] = [];
			}
			cache[topic].push(callback);
			return [topic, callback];
		};
		function _unsub( handle, total ) {
			var topic = handle[0],
				cacheLength = cache[topic].length;
			if (cache[topic]) {
				for (var i=0; i<cacheLength; i++) {
					if (cache[topic][i] === handle) {
						cache[topic].splice(cache[topic][i], 1);
						if (total) {
							delete cache[topic];
						}
					}
				}
			}
			return true;
		};
		return {
			flush: _flush,
			pub: _pub,
			sub: _sub,
			unsub: _unsub
		};
	})();

	var init = (function() {
		$data.server.argv = yargs
			.usage('Usage: $0 [-d|--database] [-p|--port port] [-q|--quiet] [-v verbosity]')
			.alias('d', 'database')
			.alias('p', 'port')
			.alias('q', 'quiet')
			.count('verbose')
			.alias('v', 'verbose')
			.argv;
		if ($data.server.argv.database) $data.database.settings.active = true;
		if ($data.server.argv.port) $data.server.settings.port = $data.server.argv.port;
		if ($data.server.argv.quiet) $data.server.settings.logs.quiet = true;
		if ($data.server.argv.verbose) $data.server.settings.logs.level = $data.server.argv.verbose+1;
	})();

	var web = (function() {
		var server = http.createServer(function(req, res) {
			var timestamp = Math.round(new Date().getTime()/1000.0);
			_log.log('Received request for '+req.url+' at '+timestamp);
		}).on('error', function(e) {
			_log.error('Error in server: '+e.message);
		}).listen( $data.server.settings.port );
	})();

})();

