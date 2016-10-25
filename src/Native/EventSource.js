/* exported _opensensorsio$website_datasubscriber$Native_EventSource */
/* global
   _elm_lang$core$Native_Scheduler,
   _elm_lang$core$Maybe$Nothing,
   _elm_lang$core$Maybe$Just,
   A2, F2, F3
*/
var _OpenSensorsIO$eventsource$Native_EventSource = (function() {
    var MIN_TIME_BETWEEN_MESSAGES_MS = 250;

    var open = function (options, url, settings) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(
            function(callback) {
                try {
                    var eventSource = new EventSource(url, options);
                } catch(err) {
                    return callback(_elm_lang$core$Native_Scheduler.fail({
                        ctor: err.name === 'SecurityError' ? 'BadSecurity' : 'BadArgs',
                        _0: err.message
                    }));
                }

                eventSource.addEventListener('open', function() {
                    callback(_elm_lang$core$Native_Scheduler.succeed(eventSource));
                });

                var lastReceivedTime = null;
                var messageHandler = function(event) {
                    var receivedTime = new Date();
                    if (lastReceivedTime === null
                        ||
                        receivedTime - lastReceivedTime > MIN_TIME_BETWEEN_MESSAGES_MS
                       ) {
                        lastReceivedTime = receivedTime;
                        _elm_lang$core$Native_Scheduler.rawSpawn(A2(
                            settings.onMessage,
                            eventSource,
                            event.data
                        ));
                    }
                };

                eventSource.addEventListener('debug', messageHandler);
                eventSource.addEventListener('message', messageHandler);

                eventSource.addEventListener('close', function(event) {
                    _elm_lang$core$Native_Scheduler.rawSpawn(settings.onClose({
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    }));
                });

                return function() {
                    if (eventSource && eventSource.close) {
                        eventSource.close();
                    }
                };
            }
        );
    };

    var send = function (socket, string) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(
            function (callback) {
                var result =
                    socket.readyState === WebSocket.OPEN
                    ? _elm_lang$core$Maybe$Nothing
                    : _elm_lang$core$Maybe$Just({ ctor: 'NotOpen' });

                try {
                    socket.send(string);
                } catch(err) {
                    result = _elm_lang$core$Maybe$Just({ ctor: 'BadString' });
                }

                callback(_elm_lang$core$Native_Scheduler.succeed(result));
            });
    };

    var close = function (code, reason, socket) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback) {
            try {
                socket.close(code, reason);
            } catch(err) {
                return callback(_elm_lang$core$Native_Scheduler.fail(_elm_lang$core$Maybe$Just({
                    ctor: err.name === 'SyntaxError' ? 'BadReason' : 'BadCode'
                })));
            }
            callback(_elm_lang$core$Native_Scheduler.succeed(_elm_lang$core$Maybe$Nothing));
        });
    };

    var bytesQueued = function(socket) {
        return _elm_lang$core$Native_Scheduler.nativeBinding(function(callback) {
            callback(_elm_lang$core$Native_Scheduler.succeed(socket.bufferedAmount));
        });
    };


    return {
        open: F3(open),
        send: F2(send),
        close: F3(close),
        bytesQueued: bytesQueued
    };
}());
