'use strict';
const _           = require('lodash');
const User        = require('./../class/User');
const ParseObject = Parse.Object.extend('GalleryActivity');
const UserFollow  = Parse.Object.extend('UserFollow');
const MasterKey       = {useMasterKey: true};

module.exports = {
    afterSave: afterSave,
    create   : create,
    feed     : feed,
};

function afterSave(req, res) {
    //if (req.object.existed()) {
    //    return
    //}

    if (!req.object.get('toUser')) {
        throw 'Undefined toUser. Skipping push for Activity ' + req.object.get('action') + ' : ' + req.object.id;
        return;
    }

    console.log('afterSave', req.object.attributes);

    let promises = [
        new Parse.Query('User').equalTo('objectId', req.object.get('fromUser').id).first({
            useMasterKey: true
        }),
        new Parse.Query('User').equalTo('objectId', req.object.get('toUser').id).first({
            useMasterKey: true
        })
    ];

    if (req.object.get('comment')) {
        promises.push(new Parse.Query('GalleryComment').equalTo('objectId', req.object.get('comment').id).first({
            useMasterKey: true
        }));
    }

    Parse.Promise.when(promises).then(result => {
        let fromUser = result[0];
        let toUser   = result[1];
        let action   = req.object.get('action');
        let UserLang = toUser.attributes.lang || 'en';
        let lang     = require('./../helpers/loadJson')(__dirname + '/../../i18n/' + UserLang + '.json');
        let channel  = toUser.attributes.username;

        if (lang[action]) {
            let message = fromUser.attributes.name + lang[action];

            // if comment your photo
            if (result.length > 2) {
                message = message + '"' + result[2].attributes.text + '"';
            }

            // Trim our message to 140 characters.
            if (message.length > 140) {
                message = message.substring(0, 140);
            }

            console.log(message);

            Parse.Push.send({
                channels: [channel],
                data    : {
                    alert: message, // Set our alert message.
                    badge: 'Increment', // Increment the target device's badge count.
                    // The following keys help Anypic load the correct photo in response to this push notification.
                    p    : 'a', // Payload Type: Activity
                    t    : 'c', // Activity Type: Comment
                    fu   : fromUser.id, // From User
                    pid  : toUser.id // Photo Id
                }
            }, {
                useMasterKey: true
            })
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
        }

    });
}

function create(obj, acl) {

    let newActivity = new ParseObject()
        .set('action', obj.action)
        .set('isApproved', true)
        .set('fromUser', obj.fromUser);

    if (obj.toUser) {
        newActivity.set('toUser', obj.toUser);
    }

    if (obj.comment) {
        newActivity.set('comment', obj.comment);
    }

    if (obj.gallery) {
        newActivity.set('gallery', obj.gallery);
    }

    if (acl) {
        newActivity.setACL(acl);
    }

    return newActivity.save(null, {
        useMasterKey: true
    });
}

function feed(req, res, next) {
    const _page  = req.params.page || 1;
    const _limit = req.params.limit || 10;

    console.log('Start feed', req.params);

    new Parse.Query(ParseObject)
        .descending('createdAt')
        .limit(_limit)
        .include('gallery')
        .equalTo('toUser', req.user)
        .skip((_page * _limit) - _limit)
        .find({
            useMasterKey: true
        })
        .then(data => {
            let _result = [];

            if (!data.length) {
                res.success(_result);
            }

            let cb = _.after(data.length, () => {
                res.success(_result);
            });

            _.each(data, item => {

                let userGet = item.get('fromUser');
                new Parse.Query('UserData').equalTo('user', userGet).first().then(_userData => {

                    let obj = {
                        item     : item,
                        action   : item.get('action'),
                        createdAt: item.get('createdAt'),
                    };

                    if (_userData) {

                        new Parse.Query(UserFollow)
                            .equalTo('from', req.user)
                            .equalTo('to', userGet)
                            .count()
                            .then(isFollow => {
                                console.log(isFollow);
                                obj.user = {
                                    obj     : _userData.get('user'),
                                    id      : _userData.get('user').id,
                                    name    : _userData.get('name'),
                                    username: _userData.get('username'),
                                    status  : _userData.get('status'),
                                    photo   : _userData.get('photo'),
                                    isFollow: isFollow > 0 ? true : false
                                };
                                _result.push(obj);
                                cb();

                            }, res.error);
                    } else {

                        // Comments
                        _result.push(obj);
                        cb();
                    }

                }, err => console.log);

            });


        }, error => res.error(error.message));
}