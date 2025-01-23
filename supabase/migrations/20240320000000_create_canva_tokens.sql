-- Create Canva tokens table
create table if not exists canva_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Ensure one token per user
  constraint unique_user_token unique (user_id)
);

-- Enable RLS
alter table canva_tokens enable row level security;

-- Create RLS policies
create policy "Users can view their own tokens"
  on canva_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tokens"
  on canva_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tokens"
  on canva_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tokens"
  on canva_tokens for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_canva_tokens_updated_at
  before update on canva_tokens
  for each row
  execute function update_updated_at_column(); 