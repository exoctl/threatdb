export interface Family {
  id: number;
  name: string;
  description: string;
}

export interface Tag {
  id: number;
  name: string;
  description: string;
}

export interface FamiliesResponse {
  families: Family[];
  code: number;
  status: string;
}

export interface TagsResponse {
  tags: Tag[];
  code: number;
  status: string;
}

export interface AnalysisRecord {
  id: number;
  file_name: string;
  file_type: string;
  sha256: string;
  sha1: string;
  sha512: string;
  sha224: string;
  sha384: string;
  sha3_256: string;
  sha3_512: string;
  file_size: number;
  file_entropy: number;
  creation_date: string;
  last_update_date: string;
  file_path: string;
  is_malicious: boolean;
  is_packed: boolean;
  family_id: number;
  description: string;
  owner: string;
  tlsh: string;
  family?: Family;
  tags?: Tag[];
}

export interface AnalysisRecordsResponse {
  records: AnalysisRecord[];
  code: number;
  status: string;
}

export interface ScanResponse {
  sha256: string;
  code: number;
  status: string;
}

export interface ClamAVThreat {
  virname: string;
  math_status: number;
}

export interface YaraRule {
  identifier: string;
  namespace: string;
}

export interface YaraThreat {
  rules: YaraRule[];
}

export interface ThreatAnalysis {
  clamav: ClamAVThreat;
  yara: YaraThreat;
}

export interface ThreatsResponse {
  threats: ThreatAnalysis;
  code: number;
  status: string;
}

export interface LuaScript {
  path: string;
  name: string;
  type: string;
}

export interface PluginsLua {
  scripts: LuaScript[];
  state_memory: string;
}

export interface PluginsResponse {
  plugins: {
    lua: PluginsLua;
  };
  code: number;
  status: string;
}

export interface YaraRuleString {
  identifier: string;
  length: number;
  index: number;
  string: string;
  flags: number;
}

export interface YaraRuleDetails {
  identifier: string;
  namespace: string;
  num_atoms: number;
  meta: Record<string, any>;
  strings: YaraRuleString[];
  flags: number;
  tags: string[] | Record<string, any>;
}

export interface YaraRulesResponse {
  rules: YaraRuleDetails[];
  count: number;
}

export interface YaraRuleActionRequest {
  rule: string;
}

export interface YaraLoadRuleRequest {
  rule: string;
  namespace: string;
}

export interface YaraActionResponse {
  message: string;
}

export interface EngineServerConfig {
  port: number;
  bindaddr: string;
  concurrency: number;
  ssl_enable: boolean;
}

export interface EngineDatabase {
  type: string;
}

export interface EngineStatusResponse {
  engine: {
    is_running: boolean;
    server: EngineServerConfig;
    database: EngineDatabase;
    configuration: Record<string, any>;
  };
}

export interface VersionResponse {
  version: string;
  major: number;
  minor: number;
  patch: number;
  code: number;
}

export interface EngineConfig {
  host: string;
  port: string;
  baseUrl: string;
}