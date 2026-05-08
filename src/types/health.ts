export interface HealthRecord {
  id?: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  heart_rate?: number;
  goal?: 'lose' | 'maintain' | 'gain';
  bmi: number;
  bmi_category: string;
  bmr: number;
  calorie_needs: number;
  ideal_weight_min: number;
  ideal_weight_max: number;
  heart_rate_status?: string;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  user_id: string;
  user_message: string;
  bot_response: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at: string;
}
