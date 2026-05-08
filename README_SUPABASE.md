# Supabase Setup for HealthMate

Please execute the following SQL in your Supabase SQL Editor to set up the required tables:

## 1. User Profiles Table
```sql
create table user_profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')) default 'sedentary',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table user_profiles enable row level security;

create policy "Users can view their own profile"
  on user_profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile"
  on user_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on user_profiles for insert
  with check ( auth.uid() = id );
```

### Migration for existing projects
If you already have the `user_profiles` table, run this to add the activity_level column:
```sql
alter table user_profiles add column if not exists activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')) default 'sedentary';
```

## 2. Health Records Table
```sql
create table health_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  date_of_birth date not null,
  gender text not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  activity_level text not null,
  heart_rate integer,
  goal text,
  bmi numeric not null,
  bmi_category text not null,
  bmr integer not null,
  calorie_needs integer not null,
  ideal_weight_min numeric not null,
  ideal_weight_max numeric not null,
  heart_rate_status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table health_records enable row level security;

create policy "Users can view their own health records"
  on health_records for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own health records"
  on health_records for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own health records"
  on health_records for delete
  using ( auth.uid() = user_id );
```

## 3. Chat Messages Table
```sql
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  user_message text not null,
  bot_response text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table chat_messages enable row level security;

create policy "Users can view their own chat messages"
  on chat_messages for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own chat messages"
  on chat_messages for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own chat messages"
  on chat_messages for delete
  using ( auth.uid() = user_id );
```
