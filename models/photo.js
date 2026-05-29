/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')
const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const fs = require('node:fs');
/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false },
  thumbId: { required: false}
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into GridFS Bucket.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(image) {
  return new Promise((resolve, reject) => {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const metadata = {
      contentType: image.contentType,
      businessId: image.businessId
    };
    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata }
    );
    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  })
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Removes image file from API server's filesystem
 */
function removeUploadedFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.path, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
exports.removeUploadedFile = removeUploadedFile

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) }).toArray();
    return results[0]
  }
}
exports.getPhotoById = getPhotoById
