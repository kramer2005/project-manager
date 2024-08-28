import Redis from 'ioredis'

let redisClient: Redis

const getRedisClient = async () => {
  if (redisClient) {
    return redisClient
  }

  return new Promise<Redis>((resolve, reject) => {
    const client = new Redis()

    client.on('connect', () => {
      resolve(client)
    })

    client.on('error', (err) => {
      reject(err)
    })
  })
}

export default getRedisClient
