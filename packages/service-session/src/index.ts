import Comm, { CommConfig } from 'comm'
import * as resolvers from './resolvers'

const config: CommConfig = {
  url: 'redis://localhost:6379',
}

const init = async () => {
  const sessionService = await Comm.createMicroservice('session', resolvers, config)

  process.on('SIGINT', async () => {
    sessionService.close()
    process.exit(0)
  })
}

init()
