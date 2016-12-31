'use strict';
const GallerySetting = require('../class/GallerySetting');
const MasterKey       = {useMasterKey: true};

module.exports = {
    status: status,
    start : start
};

function status(req, res, next) {
    console.log(req.params);
    new Parse.Query(Parse.Role)
        .equalTo('name', 'Admin')
        .first(MasterKey)
        .then(adminRole=> {

            console.log(adminRole);
            if (!adminRole) {
                return res.success('Admin Role not found');
            }

            let userRelation = adminRole.relation('users');
            return userRelation.query().count(MasterKey);
        })
        .then(count=> {
            if (count > 0) {
                return res.error('Its installed');
            } else {
                req.session = null;
                return res.success('Admin Role not found');
            }
        }, error=> {
            if (error.code === 5000) {
                // next();
                return res.error('Its installed');
            } else {
                req.session = null;
                return res.success('Admin Role not found');
            }
        });
}

function start(req, res, next) {
    let name                 = req.params.name ? req.params.name.trim() : null;
    let email                = req.params.email ? req.params.email.toLowerCase().trim() : null;
    let username             = req.params.username ? req.params.username.toLowerCase().trim() : null;
    let password             = req.params.password ? req.params.password.trim() : 'null';
    let passwordConfirmation = req.params.passwordConfirmation ? req.params.passwordConfirmation.trim() : '';

    if (!name) {
        return res.error('Name is required');
    }

    if (!email) {
        return res.error('Email is required');
    }

    if (!username) {
        return res.error('Username is required');
    }

    if (password !== passwordConfirmation) {
        return res.error("Password doesn't match");
    }

    if (password.length < 6) {
        return res.error('Password should be at least 6 characters');
    }

    var roles = [];

    let roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(true);

    var role = new Parse.Role('Admin', roleACL);
    roles.push(role);
    var role = new Parse.Role('User', roleACL);
    roles.push(role);

    let user = new Parse.User();
    user.set('name', name);
    user.set('email', email);
    user.set('username', username);
    user.set('password', password);
    user.set('roleName', 'Admin');
    user.set('gender', 'man');
    user.set('photoThumb', undefined);

    new Parse.Query(Parse.Role)
        .find()
        .then(objRoles => Parse.Object.destroyAll(objRoles, MasterKey))
        .then(() => Parse.Object.saveAll(roles))
        .then(() => user.signUp())
        .then(objUser=> {
            objUser.setACL(new Parse.ACL(objUser));
            objUser.save(null, MasterKey);

            // Create Settings
            GallerySetting
                .start(new Parse.ACL(objUser))
                .then((data)=> {
                    console.log('Settings create', data);
                    res.success(objUser.id);
                })

        }, error=> res.error(error.message));

}
