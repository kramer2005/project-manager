/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto'
import Redis from 'ioredis'

interface Message {
  channel: string
  data: any
  uuid: string
  error?: boolean
}

type AwaitingCallback = Record<string, { resolve: (value: any) => void; reject: (reason: Error) => void }>

export interface CommConfig {
  url: string
  responseTopic?: string
  timeout?: number
}

class Comm {
  private readonly publisher: Redis
  private readonly subscriber: Redis
  private awaiting: AwaitingCallback = {}
  private isMicroservice = false
  private handlers: Record<string, (data: any) => any | Promise<any>> = {}
  private responseChannel = 'comm-response'
  private timeout = 10000

  constructor(config: CommConfig) {
    this.publisher = new Redis(config.url)
    this.subscriber = new Redis(config.url)
    if (config.responseTopic) {
      this.responseChannel = config.responseTopic
    }

    this.subscriber.on('error', (error) => {
      console.error('Error in subscriber:', error)
    })

    this.publisher.on('error', (error) => {
      console.error('Error in publisher:', error)
    })

    this.subscriber.subscribe(this.responseChannel)
  }

  close() {
    this.publisher.disconnect()
    this.subscriber.disconnect()
  }

  async send<T>(channel: string, data: any): Promise<T> {
    const uuid = randomUUID()
    const message: Message = { channel, data, uuid }
    let timeout: NodeJS.Timeout
    const promise = new Promise<T>((resolve, reject) => {
      this.awaiting[uuid] = { resolve, reject }
      timeout = setTimeout(() => {
        reject(new Error('Timeout'))
        delete this.awaiting[uuid]
      }, this.timeout)
    }).finally(() => {
      clearTimeout(timeout)
    })

    this.publisher.publish(channel, JSON.stringify(message))
    return promise
  }

  private turnIntoMicroservice() {
    this.isMicroservice = true
    this.subscriber.on('message', async (channel, message) => {
      const parsedMessage: Message = JSON.parse(message)
      const handler = this.handlers[channel]
      if (handler) {
        try {
          const response = await handler(parsedMessage.data)
          this.publisher.publish(
            this.responseChannel,
            JSON.stringify({ channel, data: response, uuid: parsedMessage.uuid }),
          )
        } catch (error) {
          this.publisher.publish(
            this.responseChannel,
            JSON.stringify({ channel, data: error, uuid: parsedMessage.uuid, error: true }),
          )
        }
      }
    })
  }

  addMicroservice(name: string, handler: (data: any) => any | Promise<any>) {
    if (!this.isMicroservice) {
      this.turnIntoMicroservice()
    }

    this.handlers[name] = handler
  }

  static async createMicroservice(
    name: string,
    handlers: Record<string, (data: any) => any | Promise<any>>,
    config: CommConfig,
  ) {
    const comm = new Comm(config)
    comm.turnIntoMicroservice()
    comm.handlers = Object.keys(handlers).reduce(
      (acc, key) => {
        acc[`${name}:${key}`] = handlers[key]
        return acc
      },
      {} as Record<string, (data: any) => any | Promise<any>>,
    )

    await Promise.all(
      Object.keys(handlers).map((key) => {
        return comm.subscriber.subscribe(`${name}:${key}`)
      }),
    )

    return comm
  }

  static async create(config: CommConfig) {
    const promise = new Promise<Comm>((resolve, reject) => {
      const comm = new Comm(config)
      const ready = {
        publisher: false,
        subscriber: false,
      }
      comm.publisher.on('connect', () => {
        ready.publisher = true
        if (ready.subscriber) {
          resolve(comm)
        }
      })
      comm.publisher.on('error', (error) => {
        reject(error)
      })

      comm.subscriber.on('connect', () => {
        ready.subscriber = true
        if (ready.publisher) {
          resolve(comm)
        }
      })
      comm.subscriber.on('error', (error) => {
        reject(error)
      })

      comm.subscriber.on('message', (channel, message) => {
        const parsedMessage: Message = JSON.parse(message)

        if (channel === comm.responseChannel) {
          const awaiting = comm.awaiting[parsedMessage.uuid]
          if (awaiting) {
            if (parsedMessage.error) {
              awaiting.reject(parsedMessage.data)
            } else {
              awaiting.resolve(parsedMessage.data)
            }
            delete comm.awaiting[parsedMessage.uuid]
          }
        }
      })
    })

    return promise
  }
}

export default Comm
