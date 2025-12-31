// Infinite Flight Connect API v2 Service
// Uses TCP Socket for native Android/iOS connection
// Web version uses a mock/fallback

import { Capacitor } from '@capacitor/core';

interface IFData {
  fuelWeight?: number;
  fuelTotalQuantity?: number;
  n1?: number;
  altitude?: number;
  speed?: number;
}

type DataCallback = (data: IFData) => void;
type StatusCallback = (status: 'connected' | 'disconnected' | 'error', message?: string) => void;
type LogCallback = (message: string, type: 'info' | 'error' | 'success' | 'data') => void;

class InfiniteFlightService {
  private socket: any = null;
  private isConnected: boolean = false;
  private dataCallback: DataCallback | null = null;
  private statusCallback: StatusCallback | null = null;
  private logCallback: LogCallback | null = null;
  private TcpSocket: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isNativePlatform: boolean = false;

  // IF Connect API v2 defaults
  private readonly HOST = '127.0.0.1';
  private readonly PORT = 10111;

  constructor() {
    // Check if running on native platform
    try {
      this.isNativePlatform = Capacitor.isNativePlatform();
    } catch {
      this.isNativePlatform = false;
    }
  }

  async initialize(): Promise<boolean> {
    // Only try to load TCP socket on native platforms
    if (!this.isNativePlatform) {
      const msg = 'Running on web - TCP Socket not available';
      console.log('[IF Service]', msg);
      this.logCallback?.(msg, 'info');
      return false;
    }

    this.logCallback?.('Carregando plugin TCP...', 'info');

    try {
      // Dynamic import to avoid breaking web version
      const module = await import('capacitor-tcp-socket');
      this.TcpSocket = module.TcpSocket;
      console.log('[IF Service] TCP Socket plugin loaded successfully');
      this.logCallback?.('Plugin TCP carregado!', 'success');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('[IF Service] TCP Socket plugin not available:', error);
      this.logCallback?.(`Plugin não encontrado: ${errorMsg}`, 'error');
      return false;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.TcpSocket) {
      this.logCallback?.('Inicializando plugin...', 'info');
      const initialized = await this.initialize();
      if (!initialized) {
        this.statusCallback?.('error', 'Funcionalidade disponível apenas no App Nativo Android');
        return false;
      }
    }

    try {
      this.logCallback?.(`Conectando a ${this.HOST}:${this.PORT}...`, 'info');
      console.log(`[IF Service] Connecting to ${this.HOST}:${this.PORT}...`);
      
      this.logCallback?.('Criando socket...', 'info');
      this.socket = await this.TcpSocket.create();
      this.logCallback?.(`Socket criado: ID=${this.socket?.socketId}`, 'success');
      
      this.logCallback?.('Abrindo conexão TCP...', 'info');
      await this.TcpSocket.connect({
        socketId: this.socket.socketId,
        host: this.HOST,
        port: this.PORT
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.logCallback?.('Conexão TCP estabelecida!', 'success');
      this.statusCallback?.('connected');
      console.log('[IF Service] Connected to Infinite Flight!');

      // Start listening for data
      this.logCallback?.('Iniciando listener de dados...', 'info');
      this.listen();

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[IF Service] Connection failed:', error);
      this.logCallback?.(`ERRO conexão: ${errorMsg}`, 'error');
      this.isConnected = false;
      this.statusCallback?.('error', `Falha: ${errorMsg}`);
      return false;
    }
  }

  private async listen(): Promise<void> {
    if (!this.socket || !this.TcpSocket) return;

    try {
      // Set up data listener
      await this.TcpSocket.addListener('data', (event: { socketId: number; data: string }) => {
        if (event.socketId === this.socket?.socketId) {
          const dataLen = event.data?.length || 0;
          this.logCallback?.(`Dados recebidos: ${dataLen} bytes`, 'data');
          this.parseData(event.data);
        }
      });
      this.logCallback?.('Listener DATA registrado', 'success');

      // Set up disconnect listener
      await this.TcpSocket.addListener('close', (event: { socketId: number }) => {
        if (event.socketId === this.socket?.socketId) {
          console.log('[IF Service] Connection closed');
          this.logCallback?.('Socket fechado pelo servidor', 'info');
          this.handleDisconnect();
        }
      });
      this.logCallback?.('Listener CLOSE registrado', 'success');

      // Set up error listener
      await this.TcpSocket.addListener('error', (event: { socketId: number; error: string }) => {
        if (event.socketId === this.socket?.socketId) {
          console.error('[IF Service] Socket error:', event.error);
          this.logCallback?.(`ERRO socket: ${event.error}`, 'error');
          this.handleDisconnect();
        }
      });
      this.logCallback?.('Listener ERROR registrado', 'success');
      this.logCallback?.('Aguardando dados do IF...', 'info');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[IF Service] Listen error:', error);
      this.logCallback?.(`ERRO listener: ${errorMsg}`, 'error');
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

  onLog(callback: LogCallback): void {
    this.logCallback = callback;
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
