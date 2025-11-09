import type { NextApiRequest } from 'next'
import type { NextApiResponse } from 'next'
import type { NextApiResponseServerIO } from '@/lib/socket'
import { initSocketIO, SocketEvents } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse & NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    const io = initSocketIO(res.socket.server)
    SocketEvents.setIO(io)
    res.socket.server.io = io
  }

  res.end()
}

