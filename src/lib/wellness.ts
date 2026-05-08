export const calculateBMI = (weightKg: number, heightCm: number) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category = '';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return { bmi: parseFloat(bmi.toFixed(1)), category };
};

export const calculateBMR = (
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
) => {
  // Mifflin-St Jeor Equation
  // Male: 10*weight + 6.25*height_cm - 5*age + 5
  // Female: 10*weight + 6.25*height_cm - 5*age - 161

  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  return Math.round(bmr);
};

export const calculateDailyCalories = (bmr: number, activityLevel: string) => {
  const factors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return Math.round(bmr * (factors[activityLevel] || 1.2));
};

export const calculateIdealWeightRange = (heightCm: number) => {
  const heightM = heightCm / 100;
  // Based on BMI 18.5 to 24.9
  const min = 18.5 * (heightM * heightM);
  const max = 24.9 * (heightM * heightM);

  return {
    min: parseFloat(min.toFixed(1)),
    max: parseFloat(max.toFixed(1)),
  };
};

export const getHeartRateStatus = (heartRate?: number) => {
  if (!heartRate) return undefined;
  if (heartRate < 60) return 'Low';
  if (heartRate >= 60 && heartRate <= 100) return 'Normal';
  return 'High';
};

export const getAge = (dob: string) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const generateProtocol = (record: any) => {
  const { bmi_category, calorie_needs, goal, activity_level } = record;

  const protocol = {
    diet: {
      type: '',
      targetCalories: 0,
      macros: { p: 0, c: 0, f: 0 },
      suggestions: [] as string[]
    },
    workout: {
      focus: '',
      frequency: '',
      sessions: [] as string[]
    }
  };

  // Diet Logic
  if (goal === 'weight_loss' || bmi_category === 'Overweight' || bmi_category === 'Obese') {
    protocol.diet.type = 'Caloric Deficit / Metabolic Acceleration';
    protocol.diet.targetCalories = calorie_needs - 500;
    protocol.diet.macros = { p: 40, c: 30, f: 30 }; // High protein for satiety
    protocol.diet.suggestions = [
      'High-protein breakfast: Eggs or Greek yogurt',
      'Complex carbs only: Sweet potato, Brown rice, Quinoa',
      'Fibrous greens with every meal',
      'Intermittent fasting (16:8) recommended'
    ];
  } else if (goal === 'muscle_gain') {
    protocol.diet.type = 'Hypertrophy Fueling / Surplus';
    protocol.diet.targetCalories = calorie_needs + 300;
    protocol.diet.macros = { p: 30, c: 50, f: 20 };
    protocol.diet.suggestions = [
      'Pre-workout carb loading (Oats/Banana)',
      'Post-workout protein (Whey/Lean meat)',
      'Casein protein before sleep',
      'Maintain caloric surplus for muscle synthesis'
    ];
  } else {
    protocol.diet.type = 'Homeostasis / Maintenance';
    protocol.diet.targetCalories = calorie_needs;
    protocol.diet.macros = { p: 30, c: 40, f: 30 };
    protocol.diet.suggestions = [
      'Balanced whole-foods approach',
      'Focus on micronutrient density',
      'Maintain stable insulin levels',
      'Adequate hydration (3L+ daily)'
    ];
  }

  // Workout Logic
  if (activity_level === 'sedentary' || activity_level === 'light') {
    protocol.workout.frequency = '3 Days / Week';
    protocol.workout.focus = 'Foundation & Mobility';
    protocol.workout.sessions = [
      'Day 1: Full Body Strength (Compound movements)',
      'Day 2: LISS Cardio (30 min brisk walk)',
      'Day 3: Bodyweight Circuit & Flexibility'
    ];
  } else if (activity_level === 'moderate') {
    protocol.workout.frequency = '4-5 Days / Week';
    protocol.workout.focus = 'Functional Hypertrophy';
    protocol.workout.sessions = [
      'Push/Pull split or Upper/Lower',
      '2x Zone 2 Cardio (45 min)',
      'HIIT finishers (10 min)'
    ];
  } else {
    protocol.workout.frequency = '5-6 Days / Week';
    protocol.workout.focus = 'Athletic Performance';
    protocol.workout.sessions = [
      'Periodized strength training',
      'Agility & Explosiveness drills',
      'Active recovery (Yoga/Swimming)'
    ];
  }

  return protocol;
};
