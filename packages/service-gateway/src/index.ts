import 'reflect-metadata'
import express from 'express'
import { buildSchema } from 'type-graphql'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import getMsClient from './global/msClient'
import * as resolvers from './resolvers'
import authChecker from './lib/authChecker'

const main = async () => {
  // Initialize the microservice client
  await getMsClient()

  // Initialize the Express app
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Initialize the Apollo server
  const schema = await buildSchema({
    // @ts-expect-error - This is a valid type
    resolvers: Object.values(resolvers),
    authChecker,
  })
  const server = new ApolloServer({ schema })
  await server.start()

  // Apply the Apollo server middleware to the Express app
  app.use(
    '/graphql',
    expressMiddleware(server, {
      // Add the request object to the context, so it can be accessed in the authChecker
      context: async ({ req }) => ({
        req,
      }),
    }),
  )

  // Start the Express app
  app.listen(3000, () => {
    console.log('Service Gateway listening on port 3000')
  })
}

main()
