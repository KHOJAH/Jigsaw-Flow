import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

// Static Discord Application ID for Jigsaw Flow
export const DEFAULT_DISCORD_CLIENT_ID = '1543261825028722690'

const OPCODES = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
}

export interface DiscordActivityOptions {
  details: string
  state?: string
  startTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
}

class DiscordService {
  private socket: net.Socket | null = null
  private isConnected = false
  private isConnecting = false
  private isEnabled = true
  private clientId: string = DEFAULT_DISCORD_CLIENT_ID
  private currentActivity: DiscordActivityOptions | null = null
  private reconnectInterval: NodeJS.Timeout | null = null
  private nonceCounter = 0

  public init(clientId?: string) {
    if (clientId) {
      this.clientId = clientId.trim()
    }
    if (this.isEnabled) {
      this.connect()
    }
  }

  public setClientId(clientId: string) {
    const trimmed = clientId.trim()
    if (trimmed && trimmed !== this.clientId) {
      this.clientId = trimmed
      this.disconnect()
      if (this.isEnabled) {
        this.connect()
      }
    }
  }

  private getSocketPaths(): string[] {
    const paths: string[] = []
    const isWindows = process.platform === 'win32'

    for (let i = 0; i < 10; i++) {
      if (isWindows) {
        paths.push(`\\\\.\\pipe\\discord-ipc-${i}`)
      } else {
        const tempDir =
          process.env.XDG_RUNTIME_DIR ||
          process.env.TMPDIR ||
          process.env.TMP ||
          process.env.TEMP ||
          '/tmp'
        paths.push(path.join(tempDir, `discord-ipc-${i}`))
        paths.push(path.join(tempDir, 'app', 'com.discordapp.Discord', `discord-ipc-${i}`))
        paths.push(path.join(tempDir, 'snap.discord', `discord-ipc-${i}`))
      }
    }
    return paths
  }

  public connect() {
    if (this.isConnected || this.isConnecting || !this.isEnabled) return

    this.isConnecting = true
    const socketPaths = this.getSocketPaths()

    const tryNextPipe = (index: number) => {
      if (index >= socketPaths.length) {
        this.isConnecting = false
        this.scheduleReconnect()
        return
      }

      const socketPath = socketPaths[index]
      const socket = net.createConnection(socketPath)

      const onError = () => {
        socket.destroy()
        tryNextPipe(index + 1)
      }

      socket.once('error', onError)
      socket.once('connect', () => {
        socket.removeListener('error', onError)
        this.setupSocket(socket)
      })
    }

    tryNextPipe(0)
  }

  private setupSocket(socket: net.Socket) {
    this.socket = socket
    this.isConnected = true
    this.isConnecting = false

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }

    socket.on('data', (data) => {
      this.handleSocketData(data)
    })

    socket.on('close', () => {
      this.isConnected = false
      this.socket = null
      if (this.isEnabled) {
        this.scheduleReconnect()
      }
    })

    socket.on('error', () => {
      this.isConnected = false
    })

    // Send Handshake
    this.send(OPCODES.HANDSHAKE, {
      v: 1,
      client_id: this.clientId,
    })
  }

  private handleSocketData(buf: Buffer) {
    if (buf.length < 8) return

    try {
      const op = buf.readInt32LE(0)
      const len = buf.readInt32LE(4)
      const json = buf.toString('utf8', 8, 8 + len)
      const payload = JSON.parse(json)

      if (op === OPCODES.FRAME && payload.evt === 'READY') {
        console.log(`[Discord RPC] Connected to Discord as: ${payload.data?.user?.username}`)
        if (this.currentActivity && this.isEnabled) {
          this.applyActivity(this.currentActivity)
        }
      } else if (op === OPCODES.CLOSE) {
        console.warn('[Discord RPC] Closed by Discord:', payload)
      }
    } catch {
      // ignore parse errors
    }
  }

  private send(op: number, data: any) {
    if (!this.socket || !this.isConnected) return

    try {
      const json = JSON.stringify(data)
      const len = Buffer.byteLength(json)
      const packet = Buffer.alloc(8 + len)
      packet.writeInt32LE(op, 0)
      packet.writeInt32LE(len, 4)
      packet.write(json, 8, len, 'utf8')
      this.socket.write(packet)
    } catch {
      // ignore write errors
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval || !this.isEnabled) return
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected && !this.isConnecting && this.isEnabled) {
        this.connect()
      }
    }, 10000)
  }

  public async setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (!enabled) {
      this.clearActivity()
      this.disconnect()
    } else {
      if (!this.isConnected && !this.isConnecting) {
        this.connect()
      }
      if (this.currentActivity) {
        this.applyActivity(this.currentActivity)
      }
    }
  }

  public setActivity(options: DiscordActivityOptions) {
    this.currentActivity = options
    if (!this.isEnabled) return

    if (!this.isConnected) {
      if (!this.isConnecting) {
        this.connect()
      }
      return
    }

    this.applyActivity(options)
  }

  private applyActivity(options: DiscordActivityOptions) {
    if (!this.isConnected || !this.socket) return

    this.nonceCounter++
    const activity: any = {
      details: options.details,
      instance: false,
    }

    if (options.state) {
      activity.state = options.state
    }

    if (options.startTimestamp) {
      activity.timestamps = {
        start: Math.floor(options.startTimestamp / 1000),
      }
    }

    const assets: any = {}
    if (options.largeImageKey) {
      assets.large_image = options.largeImageKey
      if (options.largeImageText) {
        assets.large_text = options.largeImageText
      }
    }
    if (options.smallImageKey) {
      assets.small_image = options.smallImageKey
      if (options.smallImageText) {
        assets.small_text = options.smallImageText
      }
    }

    if (Object.keys(assets).length > 0) {
      activity.assets = assets
    }

    this.send(OPCODES.FRAME, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity,
      },
      nonce: `jigsaw-${this.nonceCounter}`,
    })
  }

  public clearActivity() {
    this.currentActivity = null
    if (!this.isConnected || !this.socket) return

    this.nonceCounter++
    this.send(OPCODES.FRAME, {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: null,
      },
      nonce: `jigsaw-${this.nonceCounter}`,
    })
  }

  public disconnect() {
    if (this.socket) {
      try {
        this.socket.destroy()
      } catch {
        // ignore
      }
      this.socket = null
    }
    this.isConnected = false
    this.isConnecting = false
  }

  public destroy() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
    this.disconnect()
  }
}

export const discordService = new DiscordService()
