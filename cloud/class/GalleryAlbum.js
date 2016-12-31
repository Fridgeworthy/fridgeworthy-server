'use strict';
const _               = require('lodash');
const Image           = require('./../helpers/image');
const User            = require('./../class/User');
const GalleryActivity = require('./../class/GalleryActivity');
const ParseObject     = Parse.Object.extend('GalleryAlbum');
const MasterKey       = {useMasterKey: true};


module.exports = {
    beforeSave       : beforeSave,
    afterSave        : afterSave,
    afterDelete      : afterDelete,
    list             : list,
    parseGalleryAlbum: parseGalleryAlbum
};

function afterDelete(req, res) {
    // Remove All Gallerys
    new Parse.Query('Gallery').equalTo('album', req.object).find({
        success: items => {

            // Decrement User Photos
            _.each(items, item => {
                User.decrementGallery(req.user);
            });

            // Remove all Photos
            Parse.Object.destroyAll(items, {
                success: () => {},
                error  : error => console.error("Error deleting related comments " + error.code + ": " + error.message)
            });
        },
        error  : error => console.error("Error finding related comments " + error.code + ": " + error.message)
    });
}

function parseGalleryAlbum(item) {
    let obj = {};
    if (item) {
        obj = {
            id           : item.id,
            _id          : item.id,
            title        : item.get('title'),
            description  : item.get('description'),
            commentsTotal: item.get('qtyPhotos'),
            image        : item.get('image'),
            imageThumb   : item.get('imageThumb'),
            privacity    : item.get('privacity'),
            user         : {},
            createdAt    : item.createdAt,
        }
    }

    //if (item.get('user')) {
    //    obj.user = User.parseUser(item.get('user'))
    //}

    return obj;
}


function beforeSave(req, res) {
    const gallery = req.object;
    const user    = req.user || req.object.get('user');

    if (!user) {
        return res.error('Not Authorized');
    }

    if (!gallery.get('title')) {
        return res.error('Need image title');
    }

    //https://parse.com/docs/js/guide#performance-implement-efficient-searches
    let toLowerCase = w => w.toLowerCase();
    var words       = gallery.get('title').split(/\b/);
    words           = _.map(words, toLowerCase);
    var stopWords   = ['the', 'in', 'and']
    words           = _.filter(words, w => w.match(/^\w+$/) && !_.includes(stopWords, w));
    var hashtags    = gallery.get('title').match(/#.+?\b/g);
    hashtags        = _.map(hashtags, toLowerCase)

    gallery.set('words', words);
    gallery.set('hashtags', hashtags);

    // Set default values
    gallery.set('user', user);
    gallery.set('isApproved', true);

    // Define type increment
    gallery.increment('qtyPhotos', 0);
    res.success();
}

function afterSave(req) {
    const user = req.user;

    if (req.object.existed()) {
        return
    }

    let activity = {
        action  : 'addAlbum',
        fromUser: user,
        toUser  : req.object.user,
        album   : req.object
    };
    User.incrementAlbumGallery(user);
    GalleryActivity.create(activity);
}


function list(req, res, next) {
    const params = req.params;
    const _page  = req.params.page || 1;
    const _limit = req.params.limit || 24;

    let _query = new Parse.Query(ParseObject);

    if (params.username) {
        new Parse.Query('User')
            .equalTo('username', params.username)
            .first(MasterKey)
            .then(runQuery);
    } else {
        runQuery(req.user);
    }

    function runQuery(user) {
        _query
            .descending('createdAt')
            .limit(_limit)
            .skip((_page * _limit) - _limit)
            .equalTo('user', user)
            .find(MasterKey)
            .then(data => data.map(parseAlbum))
            .then(res.success)
            .catch(error => res.error(error.message))
    }
}

function parseAlbum(item) {
    return {
        id         : item.id,
        _id        : item.id,
        image      : item.get('image'),
        imageThumb : item.get('imageThumb'),
        title      : item.get('title'),
        description: item.get('description'),
        qtyPhotos  : item.get('qtyPhotos') || 0,
        createdAt  : item.createdAt,
        user       : {
            id      : item.get('user').id,
            name    : item.get('user').get('name'),
            username: item.get('user').get('username'),
            photo   : item.get('user').get('photo'),
        }
    };
}


