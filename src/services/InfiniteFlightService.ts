// Infinite Flight Connect API v2 Service
// Uses TCP Socket for native Android/iOS connection

interface IFData {
  fuelWeight?: number;
  fuelTotalQuantity?: number;
  n1?: number;
  altitude?: number;
  speed?: number;
}

type DataCallback = (data: IFData) => void;
type StatusCallback = (status: 'connected' | 'disconnected' | 'error', message?: string) => void;

class InfiniteFlightService {
  private socket: any = null;
  private isConnected: boolean = false;
  private dataCallback: DataCallback | null = null;
  private statusCallback: StatusCallback | null = null;
  private TcpSocket: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  // IF Connect API v2 defaults
  private readonly HOST = '127.0.0.1';
  private readonly PORT = 10111;

  async initialize(): Promise<boolean> {
    try {
      // Dynamic import to avoid breaking web version
      const module = await import('capacitor-tcp-socket');
      this.TcpSocket = module.TcpSocket;
      console.log('[IF Service] TCP Socket plugin loaded successfully');
      return true;
    } catch (error) {
      console.warn('[IF Service] TCP Socket plugin not available (web mode):', error);
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.TcpSocket) {
      const initialized = await this.initialize();
      if (!initialized) {
        this.statusCallback?.('error', 'Funcionalidade disponível apenas no App Nativo Android');
        return false;
      }
    }

    try {
      console.log(`[IF Service] Connecting to ${this.HOST}:${this.PORT}...`);
      
      this.socket = await this.TcpSocket.create();
      
      await this.TcpSocket.connect({
        socketId: this.socket.socketId,
        host: this.HOST,
        port: this.PORT
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.statusCallback?.('connected');
      console.log('[IF Service] Connected to Infinite Flight!');

      // Start listening for data
      this.listen();

      return true;
    } catch (error) {
      console.error('[IF Service] Connection failed:', error);
      this.isConnected = false;
      this.statusCallback?.('error', 'Falha ao conectar. Verifique se o Infinite Flight está rodando.');
      return false;
    }
  }

  private async listen(): Promise<void> {
    if (!this.socket || !this.TcpSocket) return;

    try {
      // Set up data listener
      await this.TcpSocket.addListener('data', (event: { socketId: number; data: string }) => {
        if (event.socketId === this.socket?.socketId) {
          this.parseData(event.data);
        }
      });

      // Set up disconnect listener
      await this.TcpSocket.addListener('close', (event: { socketId: number }) => {
        if (event.socketId === this.socket?.socketId) {
          console.log('[IF Service] Connection closed');
          this.handleDisconnect();
        }
      });

      // Set up error listener
      await this.TcpSocket.addListener('error', (event: { socketId: number; error: string }) => {
        if (event.socketId === this.socket?.socketId) {
          console.error('[IF Service] Socket error:', event.error);
          this.handleDisconnect();
        }
      });

    } catch (error) {
      console.error('[IF Service] Listen error:', error);
    }
  }

  private parseData(rawData: string): void {
    try {
      // IF Connect API v2 sends JSON data
      const lines = rawData.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const parsedData: IFData = {};

          // Parse fuel data (in kg)
          if (json.FuelTotalQuantity !== undefined) {
            parsedData.fuelTotalQuantity = parseFloat(json.FuelTotalQuantity);
          }
          if (json.FuelWeight !== undefined) {
            parsedData.fuelWeight = parseFloat(json.FuelWeight);
          }
          
          // Parse engine data
          if (json.N1 !== undefined) {
            parsedData.n1 = parseFloat(json.N1);
          }

          // Parse flight data
          if (json.Altitude !== undefined) {
            parsedData.altitude = parseFloat(json.Altitude);
          }
          if (json.IndicatedAirspeed !== undefined) {
            parsedData.speed = parseFloat(json.IndicatedAirspeed);
          }

          // Only callback if we have relevant data
          if (Object.keys(parsedData).length > 0) {
            this.dataCallback?.(parsedData);
          }
        } catch (parseError) {
          // Binary data or malformed JSON - try alternative parsing
          this.parseBinaryData(line);
        }
      }
    } catch (error) {
      console.error('[IF Service] Parse error:', error);
    }
  }

  private parseBinaryData(data: string): void {
    // Handle binary protocol if needed
    // IF Connect v2 primarily uses JSON, but v1 used binary
    console.log('[IF Service] Received non-JSON data, length:', data.length);
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.statusCallback?.('disconnected');
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[IF Service] Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), 2000);
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket && this.TcpSocket) {
      try {
        await this.TcpSocket.close({ socketId: this.socket.socketId });
      } catch (error) {
        console.error('[IF Service] Disconnect error:', error);
      }
    }
    
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
    this.statusCallback?.('disconnected');
    console.log('[IF Service] Disconnected');
  }

  onData(callback: DataCallback): void {
    this.dataCallback = callback;
  }

  onStatusChange(callback: StatusCallback): void {
    this.statusCallback = callback;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Send command to IF (for future use)
  async sendCommand(command: object): Promise<boolean> {
    if (!this.isConnected || !this.socket || !this.TcpSocket) {
      console.warn('[IF Service] Cannot send command - not connected');
      return false;
    }

    try {
      const data = JSON.stringify(command) + '\n';
      await this.TcpSocket.send({
        socketId: this.socket.socketId,
        data: data
      });
      return true;
    } catch (error) {
      console.error('[IF Service] Send error:', error);
      return false;
    }
  }
}

// Singleton instance
export const infiniteFlightService = new InfiniteFlightService();
export type { IFData };
