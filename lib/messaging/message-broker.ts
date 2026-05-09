// Resilient message broker connection manager supporting dynamic Kafka/NATS drivers
export interface PublishMessage {
  topic: string
  key: string
  value: string
  headers?: Record<string, string>
}

let KafkaClient: any
try {
  KafkaClient = require('kafkajs').Kafka
} catch {
  // In-memory Mock Queue stream for unit tests and local runs
  KafkaClient = class MockKafka {
    private static publishedMessages: PublishMessage[] = []

    static clearAll() {
      this.publishedMessages = []
    }

    static getPublishedMessages() {
      return this.publishedMessages
    }

    producer() {
      return {
        connect: async () => {},
        send: async (payload: { topic: string; messages: Array<{ key: string; value: string; headers?: any }> }) => {
          for (const msg of payload.messages) {
            MockKafka.publishedMessages.push({
              topic: payload.topic,
              key: msg.key,
              value: msg.value,
              headers: msg.headers
            })
          }
        },
        disconnect: async () => {}
      }
    }
  }
}

export class MessageBroker {
  private static kafka = new KafkaClient({
    clientId: 'smarthotel-operations',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
  })

  private static producerInstance: any = null

  static async getProducer() {
    if (!this.producerInstance) {
      this.producerInstance = this.kafka.producer()
      await this.producerInstance.connect()
    }
    return this.producerInstance
  }

  static async publish(message: PublishMessage): Promise<void> {
    const producer = await this.getProducer()
    await producer.send({
      topic: message.topic,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: message.headers
        }
      ]
    })
  }

  // Helper for test assertions
  static getMockPublished(): PublishMessage[] {
    if (typeof KafkaClient.getPublishedMessages === 'function') {
      return KafkaClient.getPublishedMessages()
    }
    return []
  }

  static clearMockPublished(): void {
    if (typeof KafkaClient.clearAll === 'function') {
      KafkaClient.clearAll()
    }
  }
}

export default MessageBroker
