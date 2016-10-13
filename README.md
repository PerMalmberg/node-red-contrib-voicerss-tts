# node-red-contrib-voicerss-tts
Text-to-speech for Node-Red via Voice RSS

Ths node uses the [Voice RSS](http://www.voicerss.org) API to convert text to speech audio files for later playback by another node.

#Usage
* Register for a free API key with Voice RSS. Note that their security isn't the best as they'll send your password back to you in an email during registration, so don't reuse your password!. Enter your API key into the configuration of the node.
* Install mpg321 or other appropiate media player.
* Connect as in the example flow below.

![Example](http://i.imgur.com/DmP2g0j.png)

    [{"id":"191338af.f76157","type":"VoiceRSStts","z":"c0bde859.4f3538","name":"","apiKey":"","language":"en-gb","rate":"0","codec":"MP3","format":"48khz_16bit_stereo","cacheLocation":"/home/pi/tts-cache","x":470,"y":440,"wires":[["eb582a17.b7b478"]]}]

When a message is received, it takes the payload, as text, and queries the API based on the configuration. If sucessful, it writes a file with the audio data to the specified cache folder, and outputs the path to the file on its output.

If the same text and configuration is requested again, the node will instead output the path to the already existing file. This will keep the number of API uses down (only 350 uses/month on the free account) and also remove the need for an active network connection once the file has been retrieved.

###Disclaimer
I am not affiliated with Voice RSS
