/* eslint-disable @typescript-eslint/no-explicit-any */

import { Context } from '@project-manager/shared/graphql'
import getMsClient from '../global/msClient'
import { omit } from 'ramda'

const DefaultRoute = (msName: string) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const asyncParamsRegex = /^async \w+\(([\w]+[[,]* \w+]*)/g
    const captured = asyncParamsRegex.exec(descriptor.value.toString())
    const params = captured ? captured[1].split(',').map((param) => param.trim()) : []
    params.shift()

    const fn = async (ctx: Context, ...args: any[]) => {
      const msClient = await getMsClient()
      const response = await msClient.send(`${msName}:${key}`, {
        ...params.reduce((acc, param, i) => ({ ...acc, [param]: args[i] }), {}),
        ctx: omit(['req'], ctx),
      })

      return response
    }
    descriptor.value = fn

    return descriptor
  }
}

export default DefaultRoute
