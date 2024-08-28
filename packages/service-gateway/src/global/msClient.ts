import Comm from 'comm'

let msClient: Comm

const getMsClient = async () => {
  if (msClient) {
    return msClient
  }

  const baseMsClient = Comm.create({
    url: 'redis://localhost:6379',
    timeout: 1000,
  })

  msClient = await baseMsClient
  return msClient
}

export default getMsClient
