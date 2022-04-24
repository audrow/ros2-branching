import {tmpdir} from 'os'
import {join} from 'path'
import pino from 'pino'

const file = join(tmpdir(), `log-${process.pid}.txt`)

const transport = pino.transport({
  targets: [
    {
      level: 'warn',
      target: 'pino/file',
      options: {
        destination: file,
      },
    },
    {
      level: 'info',
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
      },
    },
  ],
})

const logger = pino(transport)

logger.info(
  {
    file,
  },
  'logging destination',
)

export default logger
