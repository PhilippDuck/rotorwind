const { Kafka } = require("kafkajs");
const { Pool } = require("pg");

const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "test-group" });

// PostgreSQL connection pool
const pool = new Pool({
  user: "superset",
  host: "postgres",
  database: "superset",
  password: "superset",
  port: 5432,
});

const saveMessageToDatabase = async (message) => {
  const client = await pool.connect();
  try {
    // Include the current timestamp using NOW()
    await client.query(
      "INSERT INTO messages(temperature, timestamp) VALUES($1, NOW())",
      [message.value.toString()]
    );
    console.log("Message saved to database with timestamp");
  } finally {
    client.release();
  }
};

const run = async () => {
  let connected = false;
  const maxAttempts = 5;
  let attempts = 0;

  // Attempt to connect to Kafka with retries
  while (!connected && attempts < maxAttempts) {
    try {
      await consumer.connect();
      connected = true;
    } catch (error) {
      console.error("Connection failed, retrying...", error);
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds
    }
  }

  if (!connected) {
    console.error("Failed to connect to Kafka after multiple attempts");
    return;
  }

  // Subscribe and consume messages
  await consumer.subscribe({ topic: "test", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        value: message.value.toString(),
      });

      // Save the message to the database with timestamp
      await saveMessageToDatabase(message);
    },
  });
};

run().catch(console.error);
