const kafka = require("kafka-node");
const { Client } = require("pg");

// Konfigurationsdetails für PostgreSQL
const pgConfig = {
  user: "superset",
  host: "postgres",
  database: "superset",
  password: "superset",
  port: 5432,
};

const kafkaHost = "kafka:9092";
const topic = "test";

// Verbindungsversuch zu PostgreSQL
async function connectToPostgreSQL() {
  const client = new Client(pgConfig);
  try {
    await client.connect();
    console.log("Connected to PostgreSQL");
    return client;
  } catch (err) {
    console.error("Failed to connect to PostgreSQL", err);
    throw err; // Weitergeben des Fehlers, um den erneuten Versuch zu signalisieren
  }
}

// Hauptfunktion, die die Verbindung zu PostgreSQL und die Einrichtung des Kafka Consumers verwaltet
async function main() {
  let pgClient;
  console.log("Versuche mit PostgreSQL zu verbinden.");

  try {
    pgClient = await connectToPostgreSQL();

    const consumerClient = new kafka.KafkaClient({ kafkaHost });
    const consumer = new kafka.Consumer(
      consumerClient,
      [{ topic, partition: 0 }],
      { autoCommit: true }
    );

    consumer.on("message", async function (message) {
      console.log("Message received:", message);
      const queryText =
        "INSERT INTO messages(text, timestamp) VALUES($1, $2) RETURNING *";
      const values = [message.value, new Date()];

      try {
        const res = await pgClient.query(queryText, values);
        console.log("Document inserted", res.rows[0]);
      } catch (err) {
        console.error("Failed to insert document into PostgreSQL", err);
      }
    });

    consumer.on("error", function (err) {
      console.error("Error:", err);
    });
  } catch (err) {
    console.error("Ein unerwarteter Fehler ist aufgetreten", err);
  }
}

main().catch((err) =>
  console.error("Ein unerwarteter Fehler ist aufgetreten", err)
);
