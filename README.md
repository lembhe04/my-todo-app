# ✅ Supabase To-Do List Web App

A full-stack **To-Do List** web application built using **HTML, CSS, and JavaScript** on the frontend, with **Supabase** as the backend for authentication, database, real-time sync, and access control.

---

## 🌟 Features

- 🔐 **User Authentication**  
  Sign up, log in, and log out securely using **Supabase Auth**.

- ✅ **Task Management (CRUD)**  
  - Add new tasks  
  - Edit existing tasks  
  - Mark tasks as done  
  - Delete tasks

- 🔍 **Filtering & Sorting**  
  - Filter: All | Completed | Pending  
  - Sort by due date (ascending)

- 🔁 **Realtime Sync**  
  Updates in the task list reflect immediately via **Supabase Subscriptions**.

- 🌗 **Light/Dark Theme Toggle**  
  Modern theme switcher with user-friendly toggle.

- 📱 **Responsive UI**  
  Mobile-friendly design with reusable components:
  - `loginForm.html`
  - `signupForm.html`
  - `dashboard.html`
  - `taskCard.html`

---

## 🧰 Tech Stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| Frontend     | HTML, CSS, JavaScript (ES Modules)  |
| Auth         | Supabase Auth                       |
| Database     | Supabase PostgreSQL                 |
| Realtime     | Supabase Subscriptions              |
| Access Control | Supabase RLS (Row Level Security) |

---

## 🗃️ Database Setup (SQL)

```sql
-- Create users table
create table users (
  id uuid primary key references auth.users (id),
  email text,
  role text default 'user'
);

-- Create tasks table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  inserted_at timestamp default now()
);

-- Enable Row Level Security (RLS)
alter table users enable row level security;
alter table tasks enable row level security;

-- Allow each user to manage only their own profile
create policy "Users manage own profile"
on users for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- Allow users to access only their own tasks
create policy "User can access own tasks"
on tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## 📁 Project Structure
```



todo-app/
├── index.html
├── dashboard.html
├── css/
│   ├── styles.css
│   └── themes.css
├── js/
│   ├── auth.js
│   ├── tasks.js
│   ├── supabase.js
│   └── theme.js

```


## 🚀 Getting Started

1.Clone the repository

    git clone https://github.com/lembhe04/todo-app.git
    
    cd todo-app

2.Set up Supabase Project

    -Create a Supabase project
    -Add the above SQL in the Supabase SQL editor
    -Enable RLS on users and tasks tables
    -Get your Supabase URL and Anon Key

3.Configure Supabase Keys

    -In supabase.js:
    -const SUPABASE_URL = 'https://your-project.supabase.co';
    -const SUPABASE_ANON_KEY = 'your-anon-public-key';

4.Open index.html in your browser and you're ready to go!