const amqp = require('amqplib');
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const { ObjectId, GridFSBucket } = require('mongodb')
const { getDbReference } = require('../lib/mongo')

async function main() {
    try {
        const connection = await amqp.connect(rabbitmqUrl);
        const channel = await connection.createChannel();
        await channel.assertQueue('thumbnail-maker');

        channel.consume('thumbnail-maker', (msg) => {
            // msg can be null if something goes awry
            if (msg) {
                // msg.content Buffer converted to String
                console.log(msg.content.toString());
            }

            // Tell RabbitMQ it's OK to remove this message from the queue
            channel.ack(msg);
        });
    } catch (err) {
        console.error(err);
    }
}

main();