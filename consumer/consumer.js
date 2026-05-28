const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const { ObjectId, GridFSBucket } = require('mongodb')
const { connectToDb, getDbReference } = require('../lib/mongo')
const { buffer } = require('node:stream/consumers')
const { Jimp } = require("jimp");
const { getPhotoById } = require('../models/photo');

async function main() {
    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue('thumbnail-maker');

        channel.consume('thumbnail-maker', async (msg) => {
            // msg can be null if something goes awry
            if (msg) {
                
                const image = await getPhotoById(msg.content.toString());
                const db = getDbReference()
                const bucket = new GridFSBucket(db, { bucketName: 'images' });
                const buf = await buffer(bucket.openDownloadStreamByName(image.filename))
                const jimg = await Jimp.fromBuffer(buf)
                console.log(jimg._exif.imageSize)
            }

            // Tell RabbitMQ it's OK to remove this message from the queue
            channel.ack(msg);
        });
    } catch (err) {
        console.error(err);
    }
}

connectToDb(function () {
    main();
});