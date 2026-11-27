// Types for CyberShield URL analysis system

export interface ProtocolCheck {
  isHttps: boolean;
  detail: string;
}

export interface DomainCheck {
  isSuspicious: boolean;
  detail: string;
}

export interface KeywordCheck {
  isTriggered: boolean;
  keywords: string[];
}

export interface ExtensionCheck {
  isDangerous: boolean;
  ext: string;
}

export interface AnalysisResult {
  url: string;
  isSafe: boolean;
  riskScore: number;
  protocol: ProtocolCheck;
  domainCheck: DomainCheck;
  keywordCheck: KeywordCheck;
  extensionCheck: ExtensionCheck;
  recommendation: string;
}

export interface SampleUrl {
  name: string;
  url: string;
  type: "safe" | "phishing";
  category: string;
}
