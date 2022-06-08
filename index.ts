// SPDX-License-Identifier: CC0-1.0

import { Kafka as BaseKafka, KafkaConfig } from 'kafkajs'
import { Issuer } from 'openid-client'

export class Kafka extends BaseKafka {
  constructor({
    client_id,
    client_secret,
    domain = 'gcn.nasa.gov',
    ...config
  }: {
    client_id: string
    client_secret?: string
    domain: 'gcn.nasa.gov' | 'test.gcn.nasa.gov' | 'dev.gcn.nasa.gov'
  } & KafkaConfig) {
    config.brokers ??= [`kafka.${domain}:9092`]
    config.ssl ??= true

    if (client_id && !config.sasl) {
      const issuer = new Issuer({
        issuer: domain,
        token_endpoint: `https://auth.${domain}/oauth2/token`,
      })

      const client = new issuer.Client({ client_id, client_secret })

      config.sasl = {
        mechanism: 'oauthbearer',
        oauthBearerProvider: async () => {
          const { access_token } = await client.grant({
            grant_type: 'client_credentials',
          })
          if (!access_token) {
            throw new Error('response must contain access_token')
          }
          return { value: access_token }
        },
      }
    }

    super(config)
  }
}
