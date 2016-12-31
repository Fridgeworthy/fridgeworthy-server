'use strict';
const _                 = require('lodash');
const User              = require('./../class/User');
const StoryActivity     = require('./../class/StoryActivity');
const StoryComment      = require('./../class/StoryComment');
const ParseObject       = Parse.Object.extend('Story');
const UserFollow        = Parse.Object.extend('UserFollow');
const MasterKey         = {useMasterKey: true};

module.exports = {
    beforeSave      : beforeSave,
    afterSave       : afterSave,
    afterDelete     : afterDelete,
    get             : get,
    feedStory       : feedStory,
    searchStory     : searchStory,
    commentStory    : commentStory,
    isStoryLiked    : isStoryLiked,
    likeStory       : likeStory,
    parseStory      : parseStory
};

function parseStory(item) {
    let obj = {};
    if (item) {
        obj = {
            id              : item.id,
            _id             : item.id,
            title           : item.get('title'),
            body            : item.get('body'),
            commentsTotal   : item.get('commentsTotal'),
            likesTotal      : item.get('likesTotal'),
            isLiked         : false,
            comments        : [],
            user            : {},
            createdAt       : item.createdAt,
            hashtags        : item.get('hashtags')
        }
    }

    if (item.get('user')) {
        obj.user = User.parseUser(item.get('user'))
    }

    return obj;
}


function beforeSave(req, res) {
    const story   = req.object;
    const user    = req.user || req.object.get('user');

    if (!user) {
        return res.error('Not Authorized');
    }

    //if (story.existed()) {
    //    if (!req.user) {
    //        return res.error('Not Authorized');
    //    }
    //}

//    if (!story.get('image')) {
//        return res.error('Upload the first image');
//    }

    if (!story.get('title')) {
        return res.error('Need story title');
    }
    
    if (!story.get('body')) {
        return res.error('Need story body');
    }

    if (!story.dirty('title') && !story.dirty('body')) {
        return res.success();
    }

    // Search Story
    //https://parse.com/docs/js/guide#performance-implement-efficient-searches
    let toLowerCase = w => w.toLowerCase();
    var words       = story.get('title' && 'body').split(/\b/);
    words           = _.map(words, toLowerCase);
    var stopWords   = ['the', 'in', 'and']
    words           = _.filter(words, w => w.match(/^\w+$/) && !_.includes(stopWords, w));
//    var hashtags    = story.get('tags').match(/#.+?\b/g);
//    hashtags        = _.map(hashtags, toLowerCase)

    story.set('words', words);
//    story.set('hashtags', hashtags);

    // 
    if (!story.existed()) {
        
        story.increment('followersTotal', 0);
        story.increment('followingsTotal', 0);
        story.increment('likesTotal', 0);
        story.increment('storiesTotal', 0);
        story.increment('commentsTotal', 0);
        story.increment('views', 0);

        new Parse.Query('UserData').equalTo('user', user).first(MasterKey).then(profile => {

                // Set default values
                story.set('user', user);
                story.set('isApproved', true);
                story.set('profile', profile);
                //story.setACL(new Parse.Parse.ACL(req.user));
                return res.success();
            });

        
    } else {
        res.success();
    }
}

function afterDelete(req, res) {
    let deleteComments = new Parse.Query('StoryComment').equalTo('story', req.object).find().then(results => {
        // Collect one promise for each delete into an array.
        let promises = [];
        _.each(results, result => {
            promises.push(result.destroy());
            User.decrementComment();
        });
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(promises);

    });

    let deleteActivity = new Parse.Query('StoryActivity').equalTo('story', req.object).find().then(results => {
        // Collect one promise for each delete into an array.
        let promises = [];
        _.each(results, result => {
            promises.push(result.destroy());
            User.decrementStory();
        });
        // Return a new promise that is resolved when all of the deletes are finished.
        return Parse.Promise.when(promises);

    });

    let promises = [
        deleteActivity,
        deleteComments
    ];

    Parse.Promise.when(promises).then(res.success).catch(res.error);


}

function afterSave(req) {
    const user = req.user;

    if (req.object.existed()) {
        return
    }

    // Activity
    let activity = {
        action  : 'addStory',
        fromUser: user,
        toUser  : req.object.user,
        story : req.object
    };

    User.incrementStory(user);
    StoryActivity.create(activity);
}

function get(objectId) {
    return new Parse.Query(ParseObject).equalTo('objectId', objectId).first(MasterKey);
}

function commentStory(req, res) {
    const params = req.params;
    const _page  = req.params.page || 1;
    const _limit = req.params.limit || 10;

    new Parse.Query(ParseObject)
        .equalTo('objectId', params.storyId)
        .first()
        .then(story => {

            new Parse.Query('StoryComment')
                .equalTo('story', story)
                .limit(_limit)
                .skip((_page * _limit) - _limit)
                .find(MasterKey)
                .then(data => {
                    let _result = [];

                    if (!data.length) {
                        res.success(_result);
                    }

                    let cb = _.after(data.length, () => {
                        res.success(_result);
                    });

                    _.each(data, itemComment => {

                        // User Data
                        let userGet = itemComment.get('user');
                        new Parse.Query('UserData').equalTo('user', userGet).first().then(user => {

                            // If not profile create profile
                            if (!itemComment.get('profile')) {
                                itemComment.set('profile', user);
                                itemComment.save();
                            }

                            // If not profile create profile
                            if (!story.get('profile')) {
                                story.set('profile', user);
                                story.save();
                            }

                            let obj = StoryComment.parseComment(itemComment);
                            console.log('Obj', obj);

                            _result.push(obj);
                            cb();
                        }).catch(res.error);
                    });
                }).catch(res.error);
        });
}


function searchStory(req, res, next) {
    const params = req.params;
    const _page  = req.params.page || 1;
    const _limit = req.params.limit || 24;

    let _query = new Parse.Query(ParseObject);

    let text = params.searchStory;

    if (text && text.length > 0) {
        let toLowerCase = w => w.toLowerCase();
        let words       = text.split(/\b/);
        words           = _.map(words, toLowerCase);

        let stopWords = ['the', 'in', 'and']
        words         = _.filter(words, w => w.match(/^\w+$/) && !_.includes(stopWords, w));

        let hashtags = text.match(/#.+?\b/g);
        hashtags     = _.map(hashtags, toLowerCase);

        if (words) {
            _query.containsAll('words', [words]);
        }

        if (hashtags) {
            _query.containsAll('hashtags', [hashtags]);
        }

    }

    _query
        .equalTo('isApproved', true)
        .descending('createdAt')
        .limit(_limit)
        .skip((_page * _limit) - _limit)
        .find(MasterKey)
        .then(data => {
            let _result = [];

            if (!data.length) {
                res.success(_result);
            }

            let cb = _.after(data.length, () => {
                res.success(_result);
            });

            _.each(data, itemStory => {

                // User Data
                let userGet = itemStory.get('user');
                new Parse.Query('UserData').equalTo('user', userGet).first({
                    useMasterKey: true
                }).then(user => {

                    let obj = parseStory(itemStory);
                    //console.log('Obj', obj);

                    // Is Liked
                    new Parse.Query('Story')
                        .equalTo('likes', req.user)
                        .equalTo('objectId', itemStory.id)
                        .first({
                            useMasterKey: true
                        })
                        .then(liked => {
                            obj.isLiked = liked ? true : false;

                            // Comments
                            new Parse.Query('StoryComment')
                                .equalTo('story', itemStory)
                                .limit(3)
                                .find({
                                    useMasterKey: true
                                })
                                .then(comments => {
                                    obj.comments = map.comments(comment => StoryComment.parseComment(comment));
                                    //console.log('itemGallery', itemGallery, user, comments);
                                    // Comments
                                    _result.push(obj);
                                    cb();

                                }).catch(res.error);
                        }).catch(res.error);
                }).catch(res.error);
            });
        }).catch(res.error);

}

function feedStory(req, res) {
    const params = req.params;
    const _page  = req.params.page || 1;
    const _limit = req.params.limit || 24;

    let _query = new Parse.Query(ParseObject);

    if (params.filter) {
        _query.contains('words', params.filter);
    }

    if (params.hashtags) {
        _query.containsAll("hashtags", [params.hashtags]);
    }

    if (params.id) {
        _query.equalTo('objectId', params.id);
    }
    
    console.log('feedStory');

    if (params.username) {
        new Parse.Query(Parse.User)
            .equalTo('username', params.username)
            .first(MasterKey)
            .then(user => {
                _query.equalTo('user', user);
                _query.containedIn('privacity', ['', null, undefined, 'public']);
                runQuery();
            }).catch(error => runQuery());
    } else {
        // Follow
        if (params.privacity === 'followers') {
            new Parse.Query(UserFollow)
                .equalTo('from', req.user)
                .include('user')
                .find(MasterKey)
                .then(users => {
                    let following = [];
                    _.map(users, userFollow => {
                        let user = userFollow.get('to');
                        if (!_.some(following, {id: user.id})) {
                            following.push(user)
                        }
                    });
                    following.push(req.user);

                    _query.containedIn('user', following)
                    _query.containedIn('privacity', ['', null, undefined, 'public']);
                    runQuery();
                }).catch(res.error);
        }

        // Me
        if (params.privacity === 'me') {
            _query.containedIn('user', [req.user])
            runQuery();
        }

        // Public
        if (!params.privacity || params.privacity === 'public') {
            _query.containedIn('privacity', ['', null, undefined, 'public']);
            runQuery();
        }

    }


    function runQuery() {
        _query
            .equalTo('isApproved', true)
            .descending('createdAt')
            .limit(_limit)
            .skip((_page * _limit) - _limit)
            .include(['user'])
            .find(MasterKey)
            .then(_data => {
                let _result = [];

                let cb = _.after(_data.length, () => res.success(_result));

                _.each(_data, _story => {

                    // User Data
                    let obj = parseStory(_story);

                    // Is Liked
                    new Parse.Query('Story')
                        .equalTo('likes', req.user)
                        .equalTo('objectId', _story.id)
                        .include(['user'])
                        .first(MasterKey)
                        .then(liked => {
                            obj.isLiked = liked ? true : false;

                            // Comments
                            new Parse.Query('StoryComment')
                                .equalTo('story', _story)
                                .limit(3)
                                .include(['user'])
                                .find(MasterKey)
                                .then(_comments => {
                                    obj.comments = _comments.map(comment => StoryComment.parseComment(comment));
                                    //console.log('itemGallery', itemGallery, user, comments);
                                    // Comments
                                    _result.push(obj);

                                    // Incremment Gallery
                                    //_gallery.increment('views');
                                    //_gallery.save();
                                    cb();

                                }, error => {
                                    // Comments
                                    _result.push(obj);

                                    // Incremment Gallery
                                    //_gallery.increment('views');
                                    //_gallery.save();
                                    cb();
                                });
                        }, res.error);
                });


            }, res.error);
    }
}

function likeStory(req, res, next) {
    const user      = req.user;
    const storyId = req.params.storyId;

    if (!user) {
        return res.error('Not Authorized');
    }

    let objParse;
    let activity;
    let response = {action: null};

    new Parse.Query('Story').get(storyId).then(story => {
        objParse = story;
        return new Parse.Query('Story')
            .equalTo('likes', user)
            .equalTo('objectId', storyId)
            .find();
    }).then(result => {

        console.log('step1', result);
        let relation = objParse.relation('likes');

        console.log('step2', relation);
        console.log('step3', relation.length);

        if (result && result.length > 0) {
            objParse.increment('likesTotal', -1);
            relation.remove(user);
            response.action = 'unlike';
        } else {
            objParse.increment('likesTotal');
            relation.add(user);
            response.action = 'like';
        }

        activity = {
            fromUser: user,
            story   : objParse,
            action  : response.action,
            toUser  : objParse.attributes.user
        };

        console.log('step4', activity);

        return objParse.save(null, MasterKey);

    }).then(data => {
        if (user.id != objParse.attributes.user.id) {
            StoryActivity.create(activity);
        }
        res.success(response);
    }, error => res.error);
}

function isStoryLiked(req, res, next) {
    const user      = req.user;
    const storyId = req.params.storyId;

    if (!user) {
        return res.error('Not Authorized');
    }

    new Parse.Query('Story')
        .equalTo('likes', user)
        .equalTo('objectId', storyId)
        .first(MasterKey)
        .then(story => res.success(story ? true : false)).catch(res.error);
}

