import { randomUUID } from 'crypto'
import { WithContext } from '../types'
import { Session } from '@project-manager/shared/graphql'
import getRedisClient from '../lib/redis'

interface CreateSession extends WithContext {
  name: string
}

export const createSession = async ({ name }: CreateSession) => {
  const redis = await getRedisClient()
  const session = {
    id: randomUUID(),
    name,
  }

  redis.set(`session:${session.id}`, JSON.stringify(session))

  return session
}

export const getSession = async ({ ctx }: WithContext): Promise<Session> => {
  const token = ctx.token

  if (!token) {
    throw new Error('Unauthorized')
  }

  const redis = await getRedisClient()
  const session = await redis.get(`session:${token}`)
  if (!session) {
    throw new Error('Session not found')
  }

  return JSON.parse(session)
}
