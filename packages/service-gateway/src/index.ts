import Comm from 'comm'

const main = async () => {
  const microservice = await Comm.createMicroservice(
    'service-gateway',
    {
      hello: async (data) => {
        return { data }
      },
    },
    {
      url: 'redis://localhost:6379',
    },
  )

  const client = await Comm.create({
    url: 'redis://localhost:6379',
  })

  const response = await client.send('service-gateway:hello', { data: 'world' })

  console.log(response)

  microservice.close()
  client.close()
}

main()
