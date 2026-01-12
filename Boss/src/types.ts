
export enum View {
  DASHBOARD = 'DASHBOARD',
  ATTENDANCE = 'ATTENDANCE',
  LIVE_VOICE = 'LIVE_VOICE',
  PROFIT_LOSS = 'PROFIT_LOSS',
  BILLS = 'BILLS',
  ADVANCE = 'ADVANCE',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  imageUrl?: string;
  isError?: boolean;
}

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  view: View;
  color: string;
}
