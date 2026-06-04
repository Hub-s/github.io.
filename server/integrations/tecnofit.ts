import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'buffer';
import { ENV } from '../_core/env';

/**
 * Cliente para integração com Tecnofit API
 * 
 * Responsável por sincronizar dados entre GymHub e Tecnofit
 */

export interface TecnofitConfig {
  apiKey: string;
  apiSecret: string;
  companyId: string;
  baseUrl?: string;
}

export interface TecnofitCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'defaulter';
  contracts?: TecnofitContract[];
}

export interface TecnofitContract {
  id: number;
  customerId: number;
  name: string;
  value: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'cancelled';
}

export interface TecnofitAttendance {
  id: number;
  customerId: number;
  customerName: string;
  checkInDate: string;
  checkInTime: string;
  modality?: string;
}

export interface TecnofitReceivable {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  referenceMonth?: string;
}

/**
 * Classe para gerenciar integração com Tecnofit
 */
export class TecnofitClient {
  private client: AxiosInstance;
  private config: TecnofitConfig;

  constructor(config: TecnofitConfig) {
    this.config = {
      baseUrl: 'https://api.tecnofit.com.br/v1',
      ...config,
    };

    // Criar cliente axios com autenticação
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: this.getAuthHeaders(),
      timeout: 10000,
    });
  }

  /**
   * Gera headers de autenticação básica
   */
  private getAuthHeaders() {
    const credentials = `${this.config.apiKey}:${this.config.apiSecret}`;
    const encoded = Buffer.from(credentials).toString('base64');

    return {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Company-Id': this.config.companyId,
    };
  }

  /**
   * Listar todos os clientes
   */
  async getCustomers(limit = 100, offset = 0): Promise<TecnofitCustomer[]> {
    try {
      const response = await this.client.get('/customers', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar clientes:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um cliente
   */
  async getCustomer(customerId: number): Promise<TecnofitCustomer | null> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data.data || null;
    } catch (error) {
      console.error(`[Tecnofit] Erro ao obter cliente ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Obter contratos de um cliente
   */
  async getCustomerContracts(customerId: number): Promise<TecnofitContract[]> {
    try {
      const response = await this.client.get(`/customers/${customerId}/contracts`);
      return response.data.data || [];
    } catch (error) {
      console.error(`[Tecnofit] Erro ao obter contratos do cliente ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Listar frequências (check-ins)
   */
  async getAttendance(limit = 100, offset = 0): Promise<TecnofitAttendance[]> {
    try {
      const response = await this.client.get('/attendance', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar frequências:', error);
      return [];
    }
  }

  /**
   * Listar frequências de um cliente
   */
  async getCustomerAttendance(customerId: number, limit = 50): Promise<TecnofitAttendance[]> {
    try {
      const response = await this.client.get('/attendance', {
        params: {
          customer_id: customerId,
          limit,
          offset: 0,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error(`[Tecnofit] Erro ao obter frequências do cliente ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Listar contas a receber
   */
  async getReceivables(
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled',
    limit = 100,
    offset = 0
  ): Promise<TecnofitReceivable[]> {
    try {
      const params: any = { limit, offset };
      if (status) params.status = status;

      const response = await this.client.get('/receivables', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar contas a receber:', error);
      return [];
    }
  }

  /**
   * Listar contas a receber de um cliente
   */
  async getCustomerReceivables(customerId: number): Promise<TecnofitReceivable[]> {
    try {
      const response = await this.client.get('/receivables', {
        params: {
          customer_id: customerId,
          limit: 100,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error(`[Tecnofit] Erro ao obter contas a receber do cliente ${customerId}:`, error);
      return [];
    }
  }

  /**
   * Listar funcionários
   */
  async getEmployees(limit = 100, offset = 0): Promise<any[]> {
    try {
      const response = await this.client.get('/employees', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar funcionários:', error);
      return [];
    }
  }

  /**
   * Listar contratos (planos)
   */
  async getContracts(limit = 100, offset = 0): Promise<any[]> {
    try {
      const response = await this.client.get('/contracts', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar contratos:', error);
      return [];
    }
  }

  /**
   * Listar modalidades
   */
  async getModalities(limit = 100, offset = 0): Promise<any[]> {
    try {
      const response = await this.client.get('/modalities', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar modalidades:', error);
      return [];
    }
  }

  /**
   * Listar produtos
   */
  async getProducts(limit = 100, offset = 0): Promise<any[]> {
    try {
      const response = await this.client.get('/products', {
        params: { limit, offset },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('[Tecnofit] Erro ao listar produtos:', error);
      return [];
    }
  }

  /**
   * Sincronizar clientes da Tecnofit com GymHub
   */
  async syncCustomers(callback?: (customer: TecnofitCustomer) => Promise<void>) {
    try {
      console.log('[Tecnofit] Iniciando sincronização de clientes...');
      
      let offset = 0;
      let totalSynced = 0;
      const limit = 100;

      while (true) {
        const customers = await this.getCustomers(limit, offset);
        
        if (customers.length === 0) break;

        for (const customer of customers) {
          try {
            if (callback) {
              await callback(customer);
            }
            totalSynced++;
          } catch (error) {
            console.error(`[Tecnofit] Erro ao sincronizar cliente ${customer.id}:`, error);
          }
        }

        offset += limit;
      }

      console.log(`[Tecnofit] Sincronização concluída: ${totalSynced} clientes`);
      return totalSynced;
    } catch (error) {
      console.error('[Tecnofit] Erro na sincronização de clientes:', error);
      throw error;
    }
  }

  /**
   * Sincronizar frequências da Tecnofit com GymHub
   */
  async syncAttendance(callback?: (attendance: TecnofitAttendance) => Promise<void>) {
    try {
      console.log('[Tecnofit] Iniciando sincronização de frequências...');
      
      let offset = 0;
      let totalSynced = 0;
      const limit = 100;

      while (true) {
        const records = await this.getAttendance(limit, offset);
        
        if (records.length === 0) break;

        for (const record of records) {
          try {
            if (callback) {
              await callback(record);
            }
            totalSynced++;
          } catch (error) {
            console.error(`[Tecnofit] Erro ao sincronizar frequência ${record.id}:`, error);
          }
        }

        offset += limit;
      }

      console.log(`[Tecnofit] Sincronização concluída: ${totalSynced} frequências`);
      return totalSynced;
    } catch (error) {
      console.error('[Tecnofit] Erro na sincronização de frequências:', error);
      throw error;
    }
  }

  /**
   * Sincronizar contas a receber da Tecnofit com GymHub
   */
  async syncReceivables(callback?: (receivable: TecnofitReceivable) => Promise<void>) {
    try {
      console.log('[Tecnofit] Iniciando sincronização de contas a receber...');
      
      let offset = 0;
      let totalSynced = 0;
      const limit = 100;

      while (true) {
        const records = await this.getReceivables(undefined, limit, offset);
        
        if (records.length === 0) break;

        for (const record of records) {
          try {
            if (callback) {
              await callback(record);
            }
            totalSynced++;
          } catch (error) {
            console.error(`[Tecnofit] Erro ao sincronizar conta a receber ${record.id}:`, error);
          }
        }

        offset += limit;
      }

      console.log(`[Tecnofit] Sincronização concluída: ${totalSynced} contas a receber`);
      return totalSynced;
    } catch (error) {
      console.error('[Tecnofit] Erro na sincronização de contas a receber:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de sincronização
   */
  async getSyncStats() {
    try {
      const [customers, attendance, receivables] = await Promise.all([
        this.getCustomers(1),
        this.getAttendance(1),
        this.getReceivables(undefined, 1),
      ]);

      return {
        customersAvailable: customers.length > 0,
        attendanceAvailable: attendance.length > 0,
        receivablesAvailable: receivables.length > 0,
        lastSync: new Date(),
      };
    } catch (error) {
      console.error('[Tecnofit] Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

/**
 * Criar instância do cliente Tecnofit
 */
export function createTecnofitClient(): TecnofitClient | null {
  const apiKey = process.env.TECNOFIT_API_KEY;
  const apiSecret = process.env.TECNOFIT_API_SECRET;
  const companyId = process.env.TECNOFIT_COMPANY_ID;

  if (!apiKey || !apiSecret || !companyId) {
    console.warn('[Tecnofit] Chaves de API não configuradas');
    return null;
  }

  return new TecnofitClient({
    apiKey,
    apiSecret,
    companyId,
  });
}
