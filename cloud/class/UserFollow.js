'use strict';
const ParseObject     = Parse.Object.extend('UserFollow');
const MasterKey       = {useMasterKey: true};

module.exports = {
    beforeSave: beforeSave,
    create    : create
};

function create() {

}

function beforeSave(req, res) {
    const object = req.object;
    const user   = req.user;
    if (!user) {
        return res.error('Not Authorized');
    }

    if (!object.toUser) {
        return res.error('Not Authorized');
    }

    object.set('fromUser', user);
    object.set('date', Date());
    res.success();
}
