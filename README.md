# GCN Kafka Client for Node.js

This is the official Node.js client for the [General Coordinates Network (GCN)](https://gcn.nasa.gov). It is a very lightweight wrapper around [Kafka.js](https://kafka.js.org).

## To Install

Run this command to install with [npm](https://www.npmjs.com):

```
npm install gcn-kafka
```

## To Use

Create a client:

```mjs
import { Kafka } from 'gcn-kafka'
const kafka = new Kafka({ client_id: '...', client_secret: '...' })
```

List topics:

```mjs
const admin = kafka.admin()
const topics = await admin.listTopics()
console.log(topics)
```

Subscribe to topics and receive alerts:

```mjs
const consumer = kafka.consumer()
await consumer.subscribe({
  topics: [
    'gcn.classic.text.FERMI_GBM_FIN_POS',
    'gcn.classic.text.LVC_INITIAL',
  ],
})

await consumer.run({
  eachMessage: async (payload) => {
    const value = payload.message.value
    console.log(value?.toString())
  },
})
```
