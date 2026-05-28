const { Router } = require('express')
const { ObjectId, GridFSBucket } = require('mongodb')
const { getDbReference } = require('../lib/mongo')

const router = Router()

router.get('/photos/:filename', async (req, res, next) => {
  try {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    const files = await bucket
      .find({ filename: req.params.filename })
      .toArray();

    if (!files || files.length === 0) {
      return next();
    }

    const file = files[0];
    res.status(200).type(file.metadata.contentType);

    bucket.openDownloadStreamByName(req.params.filename)
      .on('error', (err) => next(err))
      .pipe(res);

  } catch (err) {
    next(err);
  }
});

module.exports = router