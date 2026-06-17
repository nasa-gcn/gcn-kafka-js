// SPDX-License-Identifier: CC0-1.0

import { KafkaJS } from '@confluentinc/kafka-javascript'
import { randomUUID } from 'crypto'

type GcnKafkaConfig = {
  client_id?: string
  client_secret?: string
  domain?: 'gcn.nasa.gov' | 'test.gcn.nasa.gov' | 'dev.gcn.nasa.gov'
}

export type CommonConfig = GcnKafkaConfig &
  Omit<KafkaJS.CommonConstructorConfig, 'kafkaJS'>
export type ProducerConfig = GcnKafkaConfig &
  Omit<KafkaJS.ProducerConstructorConfig, 'kafkaJS'>
export type ConsumerConfig = GcnKafkaConfig &
  Omit<KafkaJS.ConsumerConstructorConfig, 'kafkaJS'>

function resolveConfig({
  client_id,
  client_secret,
  domain,
  ...config
}: CommonConfig) {
  config['security.protocol'] ??= 'sasl_ssl'
  config['bootstrap.servers'] ??= `kafka.${domain}`

  if (client_id) {
    config['sasl.mechanisms'] ??= 'OAUTHBEARER'
    config['sasl.oauthbearer.method'] ??= 'oidc'
    config['sasl.oauthbearer.client.id'] ??= client_id
    if (client_secret)
      config['sasl.oauthbearer.client.secret'] ??= client_secret
    config['sasl.oauthbearer.token.endpoint.url'] ??=
      `https://auth.${domain}/oauth2/token`
  }
  return config
}

export class Kafka extends KafkaJS.Kafka {
  constructor({ domain = 'gcn.nasa.gov', ...config }: CommonConfig) {
    super(resolveConfig({ domain, ...config }))
  }

  consumer({ ...config }: ConsumerConfig = {}) {
    config['group.id'] ??= randomUUID()
    return super.consumer(config)
  }

  producer({ ...config }: ProducerConfig = {}) {
    config['compression.type'] ??= 'zstd'
    return super.producer(config)
  }
}
