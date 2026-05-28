const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const { ObjectId, GridFSBucket } = require('mongodb')
const { connectToDb } = require('../lib/mongo')
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
                const jimp_image = await Jimp.read(image.filename)
                jimp_image.resize(100, 100)
                const thumbnail = await image.write(`${image.filename}tb`);
                console.log(thumbnail)
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