var RTMP = require('./node-rtmpapi');
var SimpleWebsocket = require('simple-websocket');

var url = "ws://127.0.0.1:1999";

var sock = new SimpleWebsocket(url);
sock.setMaxListeners(100);

sock.on('close', function()
{
	console.log("WTF... Socket Closed ");
});

sock.on('error', function(e)
{
	console.log("WTF... Socket Error: " + e);
});

sock.on('data', function(data)
{
	console.log("Note: incoming raw data: " + data.length + " bytes");
});

sock.on('connect', function()
{
    var transId = 0;
	var stream = new RTMP.rtmpSession(sock, true, function(me)
	{
		console.log("rtmpSession...cb...");
		var invokeChannel = new RTMP.rtmpChunk.RtmpChunkMsgClass({streamId:3}, {sock: sock, Q: me.Q, debug: true});
		invokeChannel.invokedMethods = {}; //用来保存invoke的次数，以便收到消息的时候确认对应结果

		var videoChannel = new RTMP.rtmpChunk.RtmpChunkMsgClass({streamId:8}, {sock: sock, Q: me.Q, debug: true});

        var channel2 = new RTMP.rtmpChunk.RtmpChunkMsgClass({streamId:2}, {sock: sock, Q: me.Q, debug: true});

		var msger = me.msg;
		me.Q.Q(0,function()
		{
			console.log("sending connect");
			//var chunk = new RTMP.rtmpChunk.RtmpChunkMsgClass({streamId:3}, {sock: sock, Q: me.Q, debug: true});
			//todo: 先确定可行，再重构
			invokeChannel.sendAmf0EncCmdMsg({
				cmd: 'connect', 
				transId:++transId,
				cmdObj:
				{
					app:"live",
					tcUrl: "rtmp://video.7uan7uan.com/live",
					fpad: false,
					capabilities: 15.0,
					audioCodecs: 3191,
					videoCodecs: 252,
					videoFunction: 1.0
				}
			});
			invokeChannel.invokedMethods[transId] = 'connect';
		});

		me.Q.Q(0, function()
		{
			console.log("Begin LOOP");
			msger.loop(handleMessage);
		});

        function handleMessage(chunkMsg)
        {
            var chunk = chunkMsg.chunk;
            var msg = chunk.msg;

            console.log("GOT MESSAGE: " + chunk.msgTypeText);
            console.log("===========>\n" + JSON.stringify(msg));
            //connect -> windowSize -> peerBw -> connetcResult ->
            //createStream -> onBWDown -> _checkbw -> onBWDoneResult -> createStreamResult -> play

            if(chunk.msgTypeText == "amf0cmd")
            {
                if(msg.cmd == "_result")
                {
	                var lastInvoke = invokeChannel.invokedMethods[msg.transId];
	                if(lastInvoke)
	                {
		                console.log("<--Got Invoke Result for: " + lastInvoke);
		                delete invokeChannel.invokedMethods[msg.transId];
	                }

                    if(lastInvoke == "connect") //确认是connect的结果
                    {
                        console.log("sending createStream");
                        invokeChannel.sendAmf0EncCmdMsg({
                            cmd: 'createStream',
                            transId: ++transId,
                            cmdObj: null
                        });
                        invokeChannel.invokedMethods[transId] = 'createStream';
                    }
                    else if(lastInvoke == "createStream") //确认是createStream的结果
                    {
	                    videoChannel.chunk.msgStreamId = msg.info;
                        //send play ??
                        videoChannel.sendAmf0EncCmdMsg({
                            cmd: 'play',
                            transId: ++transId,
                            cmdObj:null,
                            streamName:'B011',
	                        start:-2

                        },0);
	                    invokeChannel.invokedMethods[transId] = "play";
                    }

                }
                else if(msg.cmd == 'onBWDone')
                {
                    console.log("onBWDone");
                    //send checkBW
                    invokeChannel.sendAmf0EncCmdMsg({
                        cmd: '_checkbw',
                        transId: ++transId,
                        cmdObj:null
                    },0);
	                invokeChannel.invokedMethods[transId] = "_checkbw";
                }
            }

            me.Q.Q(0,function(){
                msger.loop(handleMessage);
            });
        }
	});
});
