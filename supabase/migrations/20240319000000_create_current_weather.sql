-- Create the locations table first
create table if not exists locations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    latitude float not null,
    longitude float not null,
    timezone text not null default 'Europe/Berlin',
    region text,
    country text not null default 'DE',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    
    -- Ensure location names are unique
    constraint unique_location_name unique (name)
);

-- Add initial location
insert into locations (name, latitude, longitude) 
values ('Hohenmölsen', 51.1667, 12.0833)
on conflict (name) do nothing;

-- Create the current_weather table with location reference
create table if not exists current_weather (
    id uuid primary key default gen_random_uuid(),
    location_id uuid not null references locations(id),
    temperature_2m float not null,
    relative_humidity_2m float not null,
    apparent_temperature float not null,
    precipitation float not null,
    wind_speed_10m float not null,
    weather_code int not null,
    is_day boolean not null,
    uv_index float not null,
    pressure_msl float not null,
    surface_pressure float not null,
    sunrise timestamp with time zone,
    sunset timestamp with time zone,
    last_updated timestamp with time zone default now(),
    
    -- Ensure only one weather record per location
    constraint unique_location_weather unique (location_id)
);

-- Create indexes
create index if not exists current_weather_location_id_idx on current_weather(location_id);
create index if not exists locations_name_idx on locations(name);

-- Create RLS policies for locations
alter table locations enable row level security;

create policy "Allow read access to authenticated users for locations"
on locations for select
to authenticated
using (true);

create policy "Allow insert access to service role for locations"
on locations for insert
to service_role
with check (true);

create policy "Allow update access to service role for locations"
on locations for update
to service_role
using (true);

-- Create RLS policies for current_weather
alter table current_weather enable row level security;

create policy "Allow read access to authenticated users for current_weather"
on current_weather for select
to authenticated
using (true);

create policy "Allow insert access to service role for current_weather"
on current_weather for insert
to service_role
with check (true);

create policy "Allow update access to service role for current_weather"
on current_weather for update
to service_role
using (true); 