'use strict';
const Install         = require('./class/Install');
const User            = require('./class/User');
const Gallery         = require('./class/Gallery');
const GalleryAlbum    = require('./class/GalleryAlbum');
const GalleryActivity = require('./class/GalleryActivity');
const GalleryComment  = require('./class/GalleryComment');
const Story           = require('./class/Story');
const StoryActivity   = require('./class/StoryActivity');
const StoryComment    = require('./class/StoryComment');
const Dashboard       = require('./class/Dashboard');
const Push            = require('./class/Push');

// Push
Parse.Cloud.define('verifyServerConnection', Push.verifyServerConnection);
Parse.Cloud.define('pushText', Push.pushText);
Parse.Cloud.define('pushChat', Push.pushChat);

// Install
Parse.Cloud.define('status', Install.status);
Parse.Cloud.define('install', Install.start);

// Admin Dashboard
Parse.Cloud.define('dashboard', Dashboard.home);

// GalleryActivity Story Activity
Parse.Cloud.define('feedActivity', GalleryActivity.feed);
Parse.Cloud.afterSave('GalleryActivity', GalleryActivity.afterSave);
Parse.Cloud.afterSave('StoryActivity', StoryActivity.afterSave);

// User
Parse.Cloud.beforeSave(Parse.User, User.beforeSave);
Parse.Cloud.afterSave(Parse.User, User.afterSave);
Parse.Cloud.afterDelete(Parse.User, User.afterDelete);

Parse.Cloud.define('findUserByUsername', User.findUserByUsername);
Parse.Cloud.define('findUserByEmail', User.findUserByEmail);
Parse.Cloud.define('profile', User.profile);
Parse.Cloud.define('followUser', User.follow);
Parse.Cloud.define('getLikers', User.getLikers);
Parse.Cloud.define('getFollowers', User.getFollowers);
Parse.Cloud.define('getFollowing', User.getFollowing);
Parse.Cloud.define('getUsers', User.getUsers);
Parse.Cloud.define('listUsers', User.listUsers);
Parse.Cloud.define('createUser', User.createUser);
Parse.Cloud.define('updateUser', User.updateUser);
Parse.Cloud.define('destroyUser', User.destroyUser);
Parse.Cloud.define('saveFacebookPicture', User.saveFacebookPicture);
Parse.Cloud.define('validateUsername', User.validateUsername);
Parse.Cloud.define('validateEmail', User.validateEmail);

// Gallery Album
Parse.Cloud.beforeSave('GalleryAlbum', GalleryAlbum.beforeSave);
Parse.Cloud.afterSave('GalleryAlbum', GalleryAlbum.afterSave);
Parse.Cloud.afterDelete('GalleryAlbum', GalleryAlbum.afterDelete);
Parse.Cloud.define('listAlbum', GalleryAlbum.list);

// Gallery
Parse.Cloud.beforeSave('Gallery', Gallery.beforeSave);
Parse.Cloud.afterSave('Gallery', Gallery.afterSave);
Parse.Cloud.afterDelete('Gallery', Gallery.afterDelete);
Parse.Cloud.define('searchGallery', Gallery.searchGallery);
Parse.Cloud.define('getAlbum', Gallery.getAlbum);
Parse.Cloud.define('getGallery', Gallery.getGallery);
Parse.Cloud.define('feedGallery', Gallery.feedGallery);
Parse.Cloud.define('commentGallery', Gallery.commentGallery);
Parse.Cloud.define('likeGallery', Gallery.likeGallery);
Parse.Cloud.define('isGalleryLiked', Gallery.isGalleryLiked);
Parse.Cloud.define('updateGallery', Gallery.updateGallery);
Parse.Cloud.define('destroyGallery', Gallery.destroyGallery);

// GalleryComment
Parse.Cloud.beforeSave('GalleryComment', GalleryComment.beforeSave);
Parse.Cloud.afterSave('GalleryComment', GalleryComment.afterSave);
Parse.Cloud.define('getComments', GalleryComment.getComments);

// Story
Parse.Cloud.beforeSave('Story', Story.beforeSave);
Parse.Cloud.afterSave('Story', Story.afterSave);
Parse.Cloud.afterDelete('Story', Story.afterDelete);
Parse.Cloud.define('searchStory', Story.searchStory);
Parse.Cloud.define('feedStory', Story.feedStory);
Parse.Cloud.define('commentStory', Story.commentStory);
Parse.Cloud.define('likeStory', Story.likeStory);
Parse.Cloud.define('isStoryLiked', Story.isStoryLiked);

// StoryComment
Parse.Cloud.beforeSave('StoryComment', StoryComment.beforeSave);
Parse.Cloud.afterSave('StoryComment', StoryComment.afterSave);
