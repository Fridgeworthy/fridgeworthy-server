'use strict';
module.exports = {
    home: home
};

function home(req, res) {
    let promises = [];

    let classCount = [
        'Gallery',
        'GalleryActivity',
        'GalleryComment',
//        'Story',
//        'StoryActivity',
//        'StoryComment',
        'User'
    ];

    classCount.map(className=>promises.push(countClass(className)));

    Parse.Promise.when(promises).then(results=> {
        let data = [];
        results.forEach((value, key)=> {
            data.push({
                title : classCount[key],
                value: value
            });
        });

        res.success(data)

    }, res.error);
}

function countClass(className) {
    return new Parse.Query(className).count({useMasterKey: true});
}