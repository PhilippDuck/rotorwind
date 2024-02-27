// producer.js
const kafka = require("kafka-node");
const Producer = kafka.Producer;
const client = new kafka.KafkaClient({ kafkaHost: "kafka:9092" });
const producer = new Producer(client);

producer.on("ready", () => {
  console.log("Producer is ready");
  setInterval(() => {
    const randomNumber = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
    const payloads = [
      { topic: "test", messages: randomNumber.toString(), partition: 0 },
    ];

    producer.send(payloads, (err, data) => {
      if (err) {
        console.log("Error sending data", err);
      } else {
        console.log("Data sent:", data);
      }
    });
  }, 3000);
});

producer.on("error", (err) => {
  console.log("Producer encountered an error", err);
});
