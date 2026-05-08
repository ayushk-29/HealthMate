import { HealthRecord } from '../types/health';

export const getBotResponse = (message: string, latestRecord?: HealthRecord): string => {
  const msg = message.toLowerCase();
  
  // Medical Emergency Fallback
  if (
    msg.includes('chest pain') ||
    msg.includes('difficulty breathing') ||
    msg.includes('stroke') ||
    msg.includes('heart attack') ||
    msg.includes('suicide') ||
    msg.includes('kill myself') ||
    msg.includes('emergency')
  ) {
    return "**Emergency Protocol Activated**\n\nI am an AI assistant, not a medical professional. If you are experiencing a medical emergency, please **call your local emergency services (like 911) immediately** or go to the nearest emergency room.";
  }

  // Health/Wellness specific questions
  if (msg.includes('bmi')) {
    if (latestRecord) {
      return `Your current **BMI is ${latestRecord.bmi}**, which is categorized as **"${latestRecord.bmi_category}"**.\n\n${latestRecord.bmi_category === 'Normal' ? 'That is a great range! Keep it up.' : 'You might want to consult a specialist for personalized advice.'}`;
    }
    return "**BMI (Body Mass Index)**\n\nIt is a measure of body fat based on your height and weight. A **normal range is 18.5 to 24.9**. You can log your metrics in the 'Check' page to see your status.";
  }

  if (msg.includes('bmr')) {
    if (latestRecord) {
      return `Your **Basal Metabolic Rate (BMR) is ${latestRecord.bmr} calories**.\n\nThis is the precise amount of energy your body needs at rest to maintain baseline physiological functions.`;
    }
    return "**BMR (Basal Metabolic Rate)**\n\nThis represents the number of calories your body burns at rest to maintain basic life functions like breathing and circulation.";
  }

  if (msg.includes('calorie')) {
    if (latestRecord) {
      return `Based on your activity level, you need approximately **${latestRecord.calorie_needs} calories per day** to maintain your current weight node.`;
    }
    return "Daily calorie needs depend on your age, gender, weight, height, and activity level. Integrate your metrics in the check page for a precise calculation.";
  }

  if (msg.includes('lose weight')) {
    let advice = "To lose weight safely, aim for a calorie deficit of **300-500 calories per day**.\n\n*   Increase protein and fiber intake.\n*   Incorporate regular physical activity.\n*   Stay hydrated.";
    if (latestRecord?.bmi_category === 'Obese' || latestRecord?.bmi_category === 'Overweight') {
      advice += "\n\n**Note:** Since your BMI status is elevated, focus on low-impact activities like walking to protect your joints.";
    }
    return advice;
  }

  if (msg.includes('gain weight')) {
    let advice = "To gain weight, focus on **nutrient-dense foods** and strength training.\n\n*   Add healthy fats (nuts, seeds, avocados).\n*   Increase complex carbohydrates.\n*   Prioritize resistance training to build muscle mass.";
    if (latestRecord?.bmi_category === 'Underweight') {
      advice += "\n\n**Note:** Since your BMI is below baseline, consider increasing meal frequency to 5-6 smaller, calorie-dense portions.";
    }
    return advice;
  }

  if (msg.includes('heart rate')) {
    if (latestRecord?.heart_rate) {
      return `Your last recorded heart rate was **${latestRecord.heart_rate} BPM (${latestRecord.heart_rate_status})**.\n\nA normal resting heart rate for adults typically ranges from **60–100 BPM**.`;
    }
    return "A normal resting heart rate for adults ranges from **60 to 100 beats per minute**. Consistent cardio training can lower your resting BPM over time.";
  }

  if (msg.includes('habit') || msg.includes('healthy')) {
    return "**Daily Wellness Protocols**\n\n1.  **Hydration:** Drink 2-3 liters of water.\n2.  **Rest:** Ensure 7-9 hours of quality sleep.\n3.  **Movement:** Take a 30-minute walk daily.\n4.  **Nutrition:** Eat 5 portions of varied vegetables.";
  }

  if (msg.includes('water')) {
    return "A general guideline is to drink about **2-3 liters (8-12 cups)** of water per day. This varies based on physiological load and environmental temperature.";
  }

  if (msg.includes('sleep') || msg.includes('exercise')) {
    return "Adults should aim for **7-9 hours** of quality sleep. For exercise, perform at least **150 minutes** of moderate aerobic activity per week as per baseline health standards.";
  }

  // Fallback
  return "**HealthMate AI Online**\n\nI am configured to assist with wellness tracking. You can ask about:\n*   BMI & BMR Status\n*   Calorie Requirements\n*   Weight Management Strategies\n*   Daily Wellness Habits\n\n*If you have a serious medical concern, please consult a physician.*";
};
