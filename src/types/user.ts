export type AIProvider = 'OPENAI' | 'OLLAMA' | 'Router API';
export type HousingContractType = '자가' | '전세' | '월세';

export interface UserProfile {
  userId: string;
  personal: {
    name: string;
    birthDate: string;
    gender: string;
    contact: string;
    region: string;
  };
  education: string;
  employmentStatus: string;
  housing: {
    housingType: HousingContractType;
    annualIncome: number; // 만원 단위
  };
  aiSettings: {
    selectedProvider: AIProvider;
    apiKey?: string;
  };
  notificationChannels: {
    telegram: {
      enabled: boolean;
      account: string;
    };
    email: {
      enabled: boolean;
      account: string;
    };
  };
}
