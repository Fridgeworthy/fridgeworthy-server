'use strict';
const Jimp = require('jimp');

module.exports = {
    resize   : resize,
    saveImage: saveImage
};

function resize(url, width, height) {
    return Jimp.read(url).then((image) => {
        const size = Math.min(image.bitmap.width, image.bitmap.height);
        const x    = (image.bitmap.width - size) / 2;
        const y    = (image.bitmap.height - size) / 2;

        var imageResized = image.crop(x, y, size, size).resize(width, height).quality(60);
        return imageResized.getBuffer(Jimp.MIME_JPEG, (err, buffer) => {
            var base64 = buffer.toString('base64');
            return new Parse.Promise.as(base64);
        })
    }).catch(err=> {
        console.log('Resize error', err);
        return Parse.Promise.error({
            message: 'Unable to read image',
            code   : 200
        });
    });
}

function saveImage(base64) {
     return new Parse.File('image.jpg', {base64: base64}).save();
}