/*
 * API sub-router for photos endpoints.
 */

const { Router } = require('express')
const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST;
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const { ObjectId } = require('mongodb')
const multer = require('multer')
const crypto = require('crypto')
const { validateAgainstSchema } = require('../lib/validation')
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById,
  removeUploadedFile
} = require('../models/photo')

const router = Router()

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const filename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = imageTypes[file.mimetype];
      callback(null, `${filename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!imageTypes[file.mimetype]);
  }
});

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res) => {
  if (validateAgainstSchema(req.body, PhotoSchema) && req.file) {
    try {
      console.log(req.file)
      const image = {
        contentType: req.file.mimetype,
        filename: req.file.filename,
        path: req.file.path,
        businessId: req.body.businessId
      };
      const id = await insertNewPhoto(image)

      // The following code chunk sends our id to the RabbitMQ queue
      const connection = await amqp.connect(rabbitmqUrl);
      const channel = await connection.createChannel();
      await channel.assertQueue('thumbnail-maker');
      channel.sendToQueue('thumbnail-maker', Buffer.from(id.toString()))
      setTimeout(() => { connection.close(); }, 500);

      await removeUploadedFile(req.file);
      res.status(201).send({
        id: id,
        links: {
          photo: `/photos/${id}`,
          business: `/businesses/${req.body.businessId}`
        }
      })
    } catch (err) {
      console.error(err)
      res.status(500).send({
        error: "Error inserting photo into DB.  Please try again later."
      })
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    })
  }
})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const image = await getPhotoById(req.params.id)
    if (image) {
      const responseBody = {
        _id: image._id,
        url: `/media/photos/${image.filename}`,
        contentType: image.metadata.contentType,
        businessId: image.metadata.businessId,
      };
      res.status(200).send(responseBody)
    } else {
      next()
    }
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    })
  }
})

module.exports = router
