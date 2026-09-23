export type Language = 'pt' | 'en' | 'es';

export type AIModelId = 
  | 'google_gemini_imagen3'
  | 'kling_ai_v15'
  | 'seedance_motion'
  | 'pixverse_v3'
  | 'veo_2_google'
  | 'flux_1_pro'
  | 'sora_openai';

export interface AIModelInfo {
  id: AIModelId;
  name: string;
  provider: string;
  badge: string;
  specialty: string;
  resolution: string;
  fps?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  language: Language;
  tokenBalance: number;
  subscriptionTier: 'free' | 'pro_weekly' | 'vip_monthly' | 'creator_annual';
  avatarUrl: string;
  isUnlimitedFreeMode?: boolean;
}

export interface CoupleFamilyTemplate {
  id: string;
  title: string;
  subtitle: string;
  type: 'couple' | 'family';
  category: string;
  previewUrl: string;
  description: string;
  sceneDetails: string;
  recommendedModel: AIModelId;
  tags: string[];
}

export interface TextToImagePreset {
  id: string;
  title: string;
  category: 'art' | 'cartoon' | 'retro' | 'posters' | 'viral' | 'cinematic';
  prompt: string;
  previewUrl: string;
  styleName: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
}

export interface PhotoEditorTool {
  id: string;
  name: string;
  category: 'enhance' | 'makeup' | 'hair' | 'age' | 'background';
  iconName: string;
  description: string;
  presets: {
    id: string;
    label: string;
    previewBefore: string;
    previewAfter: string;
    effectDescription: string;
  }[];
}

export interface DanceTemplate {
  id: string;
  title: string;
  category: string;
  duration: string;
  previewGif: string;
  videoSample?: string;
  musicTrack: string;
  tokenCost: number;
  popularBadge?: string;
  characterType?: 'adult' | 'baby' | 'grandma' | 'pet';
}

export interface HairStyleOption {
  id: string;
  name: string;
  category: 'color' | 'cut' | 'texture' | 'creative';
  previewImage: string;
  description: string;
  colorHex?: string;
  tokenCost: number;
}

export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface GenerationRecord {
  id: string;
  type: 'viral_dance' | 'hair_style' | 'avatar_preset' | 'couple_family' | 'text_to_image' | 'photo_enhance' | 'singing_face';
  templateName: string;
  status: GenerationStatus;
  inputImageUrl: string;
  secondaryImageUrl?: string;
  outputMediaUrl?: string;
  tokensDeducted: number;
  createdAt: string;
  progressPercent: number;
  currentStepMessage?: string;
  errorMessage?: string;
  selectedModel?: AIModelId;
  promptUsed?: string;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: 'deduction' | 'refund' | 'purchase' | 'subscription_grant' | 'bonus';
  description: string;
  generationId?: string;
  createdAt: string;
}

export interface CreationItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  feature: 'couple_family' | 'video_animation' | 'text_to_image' | 'photo_editor' | 'dance' | 'hair' | 'studio' | 'music' | 'gemini_chat';
  title: string;
  mediaUrl: string;
  thumbnailUrl: string;
  modelUsed: string;
  createdAt: string;
  promptOrStyle?: string;
  userId?: string;
}
