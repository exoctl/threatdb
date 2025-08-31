// Mock data for testing the threat intelligence interface
// This data simulates the API responses when the engine is not available

import { 
  AnalysisRecord, 
  AnalysisRecordsResponse, 
  ThreatsResponse, 
  YaraRulesResponse, 
  PluginsResponse, 
  VersionResponse 
} from '@/types/api';

export const mockAnalysisRecords: AnalysisRecordsResponse = {
  records: [
    {
      id: 1,
      file_name: "suspicious_script.js",
      file_type: "application/javascript",
      sha256: "a1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234",
      sha1: "1234567890abcdef1234567890abcdef12345678",
      sha512: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      sha224: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      sha384: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      sha3_256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      sha3_512: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
      file_size: 2048,
      file_entropy: 6.7432,
      creation_date: "2025-08-20",
      last_update_date: "2025-08-20",
      file_path: "./uploads",
      is_malicious: true,
      is_packed: false,
      owner: "demo_user"
    },
    {
      id: 2,
      file_name: "clean_document.pdf",
      file_type: "application/pdf",
      sha256: "b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234a",
      sha1: "234567890abcdef1234567890abcdef123456789a",
      sha512: "234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123",
      sha224: "234567890abcdef1234567890abcdef1234567890abcdef123456789a",
      sha384: "234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdea",
      sha3_256: "234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef23",
      sha3_512: "234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef23",
      file_size: 15360,
      file_entropy: 3.2451,
      creation_date: "2025-08-19",
      last_update_date: "2025-08-20",
      file_path: "./uploads",
      is_malicious: false,
      is_packed: false,
      owner: "demo_user"
    },
    {
      id: 3,
      file_name: "malware.exe",
      file_type: "application/x-executable",
      sha256: "c3d4e5f6789012345678901234567890abcdef123456789012345678901234ab",
      sha1: "34567890abcdef1234567890abcdef123456789ab",
      sha512: "34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
      sha224: "34567890abcdef1234567890abcdef1234567890abcdef123456789ab",
      sha384: "34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefb",
      sha3_256: "34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef34",
      sha3_512: "34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef34",
      file_size: 51200,
      file_entropy: 7.9876,
      creation_date: "2025-08-18",
      last_update_date: "2025-08-20",
      file_path: "./uploads",
      is_malicious: true,
      is_packed: true,
      owner: "demo_user"
    }
  ],
  code: 200,
  status: "connected"
};

export const mockThreatsResponse: ThreatsResponse = {
  threats: {
    clamav: {
      virname: "Win.Trojan.Generic-1234",
      math_status: 1
    },
    yara: {
      rules: [
        {
          identifier: "SuspiciousScript",
          namespace: "demo.rules.javascript"
        },
        {
          identifier: "ObfuscatedCode",
          namespace: "demo.rules.general"
        }
      ]
    }
  },
  code: 200,
  status: "connected"
};

export const mockYaraRules: YaraRulesResponse = {
  rules: [
    {
      identifier: "SuspiciousScript",
      namespace: "demo.rules.javascript",
      num_atoms: 5,
      meta: {
        author: "Security Team",
        description: "Detects suspicious JavaScript patterns",
        severity: "medium"
      }
    },
    {
      identifier: "ObfuscatedCode",
      namespace: "demo.rules.general",
      num_atoms: 12,
      meta: {
        author: "Security Team",
        description: "Detects obfuscated code patterns",
        severity: "high"
      }
    },
    {
      identifier: "MalwareFamily_XYZ",
      namespace: "demo.rules.malware",
      num_atoms: 8,
      meta: {
        author: "Threat Intel Team",
        description: "Detects XYZ malware family",
        severity: "critical"
      }
    }
  ],
  count: 3
};

export const mockPlugins: PluginsResponse = {
  plugins: {
    lua: {
      scripts: [
        {
          path: "src/plugins/version.lua",
          name: "version.lua",
          type: "file"
        },
        {
          path: "src/plugins/yara_engine/yara_scanner.lua",
          name: "yara_scanner.lua",
          type: "file"
        },
        {
          path: "src/plugins/clamav_engine/clamav_scanner.lua",
          name: "clamav_scanner.lua",
          type: "file"
        },
        {
          path: "src/plugins/analysis/file_analyzer.lua",
          name: "file_analyzer.lua",
          type: "file"
        },
        {
          path: "src/plugins/api/rest_server.lua",
          name: "rest_server.lua",
          type: "file"
        }
      ],
      state_memory: "0xDEMO123"
    }
  },
  code: 200,
  status: "connected"
};

export const mockVersion: VersionResponse = {
  version: "1.2.0-demo",
  major: 1,
  minor: 2,
  patch: 0,
  code: 258
};