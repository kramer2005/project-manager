import { Context } from '@project-manager/shared/graphql'
import getMsClient from '../global/msClient'
import { omit } from 'ramda'

interface AuthChecker {
  context: Context
}

const authChecker = async ({ context }: AuthChecker) => {
  const msClient = await getMsClient()
  const ctx: Context = context
  ctx.token = ctx.req.headers.authorization
  try {
    ctx.session = await msClient.send('session:getSession', { ctx: omit(['req'], ctx) })
  } catch (error) {
    return false
  }

  return true
}

export default authChecker
