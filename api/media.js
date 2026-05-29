const { Router } = require('express')
const { ObjectId, GridFSBucket } = require('mongodb')
const { getDbReference } = require('../lib/mongo')

const router = Router()

router.get('/photos/:id', async (req, res, next) => {
  try {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    const files = await bucket
      .find({ _id: new ObjectId(req.params.id.split('.')[0]) })
      .toArray();

    if (!files || files.length === 0) {
      return next();
    }

    const file = files[0];
    res.status(200).type(file.metadata.contentType);

    bucket.openDownloadStream(file._id)
      .on('error', (err) => next(err))
      .pipe(res);

  } catch (err) {
    next(err);
  }
});


router.get('/thumbs/:id', async (req, res, next) => {
  try {
    const db = getDbReference();

    const photo = await db.collection('images.files')
      .findOne({ _id: new ObjectId(req.params.id.split('.')[0]) });

    const thumbId = photo.metadata.thumbId
    const bucket = new GridFSBucket(db, { bucketName: 'thumbs' });

    const files = await bucket
      .find({ _id: thumbId })
      .toArray();

    if (!files || files.length === 0) {
      return next();
    }

    const file = files[0];
    res.status(200).type('image/jpeg');

    bucket.openDownloadStream(file._id)
      .on('error', (err) => next(err))
      .pipe(res);

  } catch (err) {
    next(err);
  }
});

module.exports = router