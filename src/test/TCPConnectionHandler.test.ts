import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TCPConnectionHandler } from '../connection/TCPConnectionHandler'

describe('TCPConnectionHandler', () => {
  let handler: TCPConnectionHandler
  
  beforeEach(() => {
    handler = new TCPConnectionHandler({ coolPort: 40000, hotPort: 50000 })
  })

  afterEach(async () => {
    await handler.stop()
  })

  describe('constructor', () => {
    it('should create handler with default ports', () => {
      const defaultHandler = new TCPConnectionHandler()
      expect(defaultHandler).toBeDefined()
    })

    it('should create handler with custom ports', () => {
      const customHandler = new TCPConnectionHandler({ coolPort: 30000, hotPort: 35000 })
      expect(customHandler).toBeDefined()
    })
  })

  describe('start', () => {
    it('should start servers on specified ports', async () => {
      // This is a basic test that the method doesn't throw
      await expect(handler.start()).resolves.not.toThrow()
    })
  })

  describe('stop', () => {
    it('should stop servers gracefully', async () => {
      await handler.start()
      await expect(handler.stop()).resolves.not.toThrow()
    })

    it('should handle stop when not started', async () => {
      await expect(handler.stop()).resolves.not.toThrow()
    })
  })

  describe('isConnected', () => {
    it('should return false when no connections', () => {
      expect(handler.isConnected('cool')).toBe(false)
      expect(handler.isConnected('hot')).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('should reject when player not connected', async () => {
      await expect(handler.sendMessage('cool', 'test message'))
        .rejects.toThrow('Player cool is not connected')
    })
  })

  describe('receiveMessage', () => {
    it('should reject when player not connected', async () => {
      await expect(handler.receiveMessage('cool'))
        .rejects.toThrow('Player cool is not connected')
    })
  })

  describe('disconnect', () => {
    it('should handle disconnect when not connected', async () => {
      await expect(handler.disconnect('cool')).resolves.not.toThrow()
    })
  })

  describe('waitForConnections', () => {
    it('should timeout if no connections are made', async () => {
      await handler.start()
      
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), 100)
      })
      
      await expect(Promise.race([handler.waitForConnections(), timeout]))
        .rejects.toThrow('Test timeout')
    }, 1000)
  })
})