'use strict';
const MasterKey = {useMasterKey: true};

module.exports = {
    verifyServerConnection: verifyServerConnection,
    pushText              : pushText,
    pushChat              : pushChat,
};

function verifyServerConnection(req, res) {
    console.log('Parse.Cloud: verifyServerConnection. installationId ---' + req.installationId.slice(-5));
    res.success({
        status: 'a okay',
        ts    : Date.now()
    });
}


function pushText(req, res) {
    var data = {
        alert: req.params.textMsg || "Hello from your Parse Server"
    };
    _sendPushToAll(data, res, req.params.delayMs || 0);
}

function pushChat(req, res) {
    //setting the 'event' key will trigger receivePN:chat on the client
    var data = {
        alert: req.params.textMsg || "Chat msg from your Parse Server",
        event: 'chat'
    };

    _sendPushToAll(data, res, req.params.delayMs || 0);
}

function _sendPushToAll(data, res, delayMs) {
    console.log('Parse.Push data: ' + JSON.stringify(data));

    //
    // timeout is useful for testing coldstart pn with only 1 device
    //
    setTimeout(function () {
        var query = new Parse.Query(Parse.Installation);
        Parse.Push.send({
            where: query,
            data : data,
        }, MasterKey)
             .then(function () {
                 console.log('push sent. args received: ' + JSON.stringify(arguments) + '\n');
                 res.success({
                     status: 'push sent',
                     ts    : Date.now()
                 });
             }, function (error) {
                 console.log('push failed. ' + JSON.stringify(error) + '\n');
                 res.error(error);
             });
    }, delayMs);
}