// SPDX-License-Identifier: CC0-1.0

import {
  CompressionCodecs,
  CompressionTypes,
  Kafka as BaseKafka,
  Partitioners,
} from 'kafkajs'
import type {
  KafkaConfig as BaseKafkaConfig,
  ConsumerConfig as BaseConsumerConfig,
  ProducerConfig,
} from 'kafkajs'
import { Issuer } from 'openid-client'
import { randomUUID } from 'crypto'

import { compress, decompress } from '@mongodb-js/zstd'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

CompressionCodecs[CompressionTypes.ZSTD] = () => {
  return {
    compress,
    decompress,
  }
}

type KafkaConfig = {
  client_id: string
  scope: string
  domain?: 'gcn.nasa.gov' | 'test.gcn.nasa.gov' | 'dev.gcn.nasa.gov'
} & Omit<BaseKafkaConfig, 'brokers'>

type ConsumerConfig = Omit<BaseConsumerConfig, 'groupId'> &
  Partial<Pick<BaseConsumerConfig, 'groupId'>>

class Kafka extends BaseKafka {
  constructor({
    client_id,
    scope,
    domain = 'gcn.nasa.gov',
    ...config
  }: KafkaConfig) {
    const brokers = [`kafka.${domain}:9092`]
    config.ssl ??= true

    if (client_id && !config.sasl) {
      const issuer = new Issuer({
        issuer: domain,
        token_endpoint: `https://auth.${domain}/oauth2/token`,
      })

      const client = new issuer.Client({
        client_id,
        token_endpoint_auth_method: 'none',
        response_types: ['code'],
      })
      const refreshToken = readFileSync(
        join(homedir(), '.gcn', scope.replace('/', '_')),
      ).toString()
      config.sasl = {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const { access_token } = await client.refresh(refreshToken)
          if (!access_token) {
            throw new Error('response must contain access_token')
          }
          return { value: access_token }
        },
      }
    }

    super({ brokers, ...config })
  }

  consumer({ groupId, ...config }: ConsumerConfig = {}) {
    groupId ??= randomUUID()
    return super.consumer({ groupId, ...config })
  }

  producer({ createPartitioner, ...config }: ProducerConfig = {}) {
    // Suppress default partitioner warning.
    // FIXME: remove once KafkaJS has removed the warning.
    // See https://kafka.js.org/docs/migration-guide-v2.0.0#producer-new-default-partitioner
    createPartitioner ??= Partitioners.DefaultPartitioner
    return super.producer({ createPartitioner, ...config })
  }
}

export * from 'kafkajs'
export { Kafka, ConsumerConfig, KafkaConfig }
