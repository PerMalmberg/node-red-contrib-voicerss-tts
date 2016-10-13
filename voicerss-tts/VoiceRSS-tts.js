// Licensed under the MIT license, see LICENSE file.
// Author: Per Malmberg (https://github.com/PerMalmberg)
module.exports = function(RED) {
    function VoiceRSStts(config) {
        RED.nodes.createNode(this,config);
		this.config = config;
		var node = this;
		var fs = require('fs');
		var request = require('request');
		var path = require('path');

        this.on('input', function(msg) {
			var topic = msg.topic;
			var payload = msg.payload;
			
			if( payload !== undefined ) {
                getAudio( payload );
			}
        });

        function displayStatus( value, text )
        {
		    node.status(
			{
				fill: value ? "green" : "red",
				shape: value ? "dot" : "ring",
				text: text
			}
		    );
	    }

        function Base64ToBuffer( b64 )
        {
            return new Buffer(b64, 'base64');
        }

        function getHash( text )
        {
            // Credits to to http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
            var hash = 0;

            if (text.length == 0)
            {
                return hash;
            }

            for (i = 0; i < text.length; i++) {
                char = text.charCodeAt(i);
                hash = ((hash<<5)-hash)+char;
                hash = hash & hash; // Convert to 32bit integer
            }

            return hash;
        }

        function mkdirSync( path )
        {
            try
            {
                fs.mkdirSync( path );
            }
            catch(e)
            {
                if( e.code != 'EEXIST' )
                {
                    throw e;
                }
            }
        }

        function prepareOutputDir()
        {
            var result = false;
            try {
                mkdirSync( config.cacheLocation );
                result = true;
            }
            catch( e )
            {
                var m = "Could not prepare output directory";
                displayStatus( false, m );
                node.log( m );
            }

            return result;
        }

        function fileExists( path )
        {
            var result = false;

            try {
                fs.accessSync( path, fs.F_OK | fs.R_OK );
                result = true;
            }
            catch( e )
            {
                // It isn't accessible
            }
            return result;
        }

        function sendMessge( filePath )
        {
            node.send(
                {
                topic: "TTS-File",
                payload: filePath
                }
            );
        }

        function isErrorResponse( body )
        {
            var result =
                body === "The subscription is expired or requests count limitation is exceeded!"
                || body === "ERROR: The request content length is too large!"
                || body === "ERROR: The language does not support!"
                || body === "ERROR: The language is not specified!"
                || body === "ERROR: The text is not specified!"
                || body === "ERROR: The API key is not available!"
                || body === "ERROR: The API key is not specified!"
                || body === "ERROR: The subscription does not support SSML!"

            return result;
        }

        function getAudio( text )
        {
            // Set the headers
            var headers = {
                'User-Agent':       'Node-Red',
                'Content-Type':     'application/x-www-form-urlencoded'
            };

            // Configure the request
            var options = {
                url: 'https://api.voicerss.org',
                method: 'POST',
                headers: headers,
                form: {
                    "key": config.apiKey,
                    "src": text,
                    "hl": config.language,
                    "f": config.format,
                    "c": config.codec,
                    "r": config.rate,
                    "b64": true
                }
            };

            if( prepareOutputDir() ) {
                // Include the current config in the hash so that if the config changes we request new audio.
                var hashedName = getHash( text + JSON.stringify( config ) );
                outputFile = path.join( config.cacheLocation, hashedName + "." + config.codec );

                if( fileExists( outputFile ) ) {
                    // File already exists, use the cached file.
                    displayStatus( true, "Used cached file" );
                    sendMessge( outputFile );
                }
                else
                {
                    // Start the request
                    request(options, function (error, response, body) {
                        if( error )
                        {
                            displayStatus( false, error );
                            node.log( error );
                        }
                        else if ( response.statusCode == 200)
                        {
                            // The API does not use standard HTTP status codes, instead it uses
                            // a text code response. :(

                            if( isErrorResponse( body ) )
                            {
                                displayStatus( false, body );
                            }
                            else {
                                // Print out the response body
                                var wstream = fs.createWriteStream( outputFile );

                                wstream.on('finish', function () {
                                    displayStatus( true, "File written" );
                                    sendMessge( outputFile );
                                });

                                wstream.write( Base64ToBuffer( body) );
                                wstream.end();
                            }
                        }
                        else
                        {
                            displayStatus( false, "Got response: " + response.statusCode );
                            node.log( response.statusCode );
                        }
                    });
                }
            }
        }
    }
	
    RED.nodes.registerType("VoiceRSStts", VoiceRSStts);
}