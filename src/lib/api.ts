import {
  AnalysisRecordsResponse,
  ScanResponse,
  ThreatsResponse,
  PluginsResponse,
  YaraRulesResponse,
  YaraActionResponse,
  VersionResponse,
  EngineStatusResponse,
  EngineConfig,
  AnalysisRecord,
  FamiliesResponse,
  TagsResponse,
  Family,
  Tag,
} from '@/types/api';

interface CreateUpdateResponse {
  id: number;
  name: string;
  description: string;
  code: number;
  status: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(config: EngineConfig) {
    this.baseUrl = config.baseUrl;
  }

  updateBaseUrl(config: EngineConfig) {
    this.baseUrl = config.baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getAnalysisRecords(): Promise<AnalysisRecordsResponse> {
    return this.get<AnalysisRecordsResponse>('/engine/v1/analysis/records');
  }

  async getFamilies(): Promise<FamiliesResponse> {
    return this.get<FamiliesResponse>('/engine/v1/analysis/families');
  }

  async getTags(): Promise<TagsResponse> {
    return this.get<TagsResponse>('/engine/v1/analysis/tags');
  }

  async createFamily(data: { name: string; description: string }): Promise<CreateUpdateResponse> {
    return this.post<CreateUpdateResponse>('/engine/v1/analysis/families/create', data);
  }

  async updateFamily(id: number, data: { name: string; description: string }): Promise<CreateUpdateResponse> {
    return this.post<CreateUpdateResponse>(`/engine/v1/analysis/families/update`, { id, ...data });
  }

  async createTag(data: { name: string; description: string }): Promise<CreateUpdateResponse> {
    return this.post<CreateUpdateResponse>('/engine/v1/analysis/tags/create', data);
  }

  async updateTag(id: number, data: { name: string; description: string }): Promise<CreateUpdateResponse> {
    return this.post<CreateUpdateResponse>(`/engine/v1/analysis/tags/update`, { id, ...data });
  }

  async scanFile(file: File): Promise<ScanResponse> {
    const response = await fetch(`${this.baseUrl}/engine/v1/analysis/scan`, {
      method: 'POST',
      body: file,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async rescanFile(sha256: string): Promise<ScanResponse> {
    return this.post<ScanResponse>('/engine/v1/analysis/rescan', { sha256 });
  }

  async getThreats(sha256: string): Promise<ThreatsResponse> {
    return this.post<ThreatsResponse>('/engine/v1/analysis/scan/threats', { sha256 });
  }

  async getPlugins(): Promise<PluginsResponse> {
    return this.get<PluginsResponse>('/engine/v1/plugins');
  }

  async getYaraRules(): Promise<YaraRulesResponse> {
    return this.get<YaraRulesResponse>('/yara/rules');
  }

  async getVersion(): Promise<VersionResponse> {
    return this.get<VersionResponse>('/version');
  }

  async getEngineStatus(): Promise<EngineStatusResponse> {
    return this.get<EngineStatusResponse>('/status');
  }

  async getCompiledYaraRules(): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/yara/compiled/rules`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  async enableYaraRule(rule: string): Promise<YaraActionResponse> {
    return this.post<YaraActionResponse>('/yara/enable/rules', { rule });
  }

  async disableYaraRule(rule: string): Promise<YaraActionResponse> {
    return this.post<YaraActionResponse>('/yara/disable/rules', { rule });
  }

  async loadYaraRule(ruleContent: string, namespace: string): Promise<YaraActionResponse> {
    return this.post<YaraActionResponse>('/yara/load/rules', { rule: ruleContent, namespace });
  }

  async updateRecord(sha256: string, data: Partial<AnalysisRecord>): Promise<{ message: string }> {
    return this.post<{ message: string }>('/engine/v1/analysis/records/update', { sha256, ...data });
  }

  async deleteRecord(sha256: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/engine/v1/analysis/records/delete', { sha256 });
  }
}

export default ApiClient;