# 📚 AI-Powered Library Management System

Full-stack library app with AI chat and book recommendations. Users manage their books, admins see everything + analytics.

## 🔑 Demo Credentials

**Admin:**
- Username: `zana-admin`
- Password: `zanamaemira`


> ⚠️ **First load takes 30-60s** (free tier hosting - Render spins down after inactivity)


## Link to deployed app
**You can test the deployed app here:** https://unrivaled-starburst-8d4d54.netlify.app/login

---

## 🚀 Quick Start
# You can run the app locally using Docker
⚠️**Switch to `dev` branch**
```bash
# 1. Clone repo
git clone https://github.com/misinizana/library-management.git
cd library-management

# 2. Add env file
cp .env.example .env

# 3. Run with Docker
docker-compose up --build

```

Access on https://localhost:3000


**That's it!** 🎉

---

## 🛠️ Tech Stack

- **Frontend:** React, deployed on Netlify
- **Backend:** Django + Django REST Framework, deployed on Render  
- **Database:** MySQL on Aiven
- **AI:** OpenRouter API (GPT-4o-mini)
- **External API:** Google Books API
- **Auth:** Django's built-in auth with JWT tokens (Djoser)
- **DevOps:** Docker + Docker Compose

---

## 📊 Database Schema

**2 main tables:**

**`library_user`**
- id, username, email, password (hashed), is_admin, date_joined

**`library_book`**  
- id, title, author, genre, status (to_read/reading/completed), user_id (FK), cover_image, description, page_count, created_at, updated_at

**Relationships:** User → Books (one-to-many)

---

## ✨ Features

### 👤 User Features
- Add books manually or search Google Books API
- Edit/delete books with confirmation dialogs
- Filter by genre and reading status
- **AI Chat:** Ask questions about your library ("What am I reading?", "Summarize my reading habits")
- **AI Recommendations:** Get 3-5 personalized suggestions based on last 30 days (3 similar genres + 2 new ones)

### 🔐 Admin Features  
- **User Management:** View, edit, delete all users and their books
- **Analytics Dashboard:** Total users, books, genre distribution, popular books, activity trends
- **Unrestricted AI Chat:** Query any user's data ("Who has the most books?", "What's the most popular genre?")
- **Security:** Only READ operations allowed on database (SQL injection prevented)

---

## 🤖 AI Architecture

**Why one LLM service for both features?**  
Both AI Chat and Recommendations share `llm_service/` for consistency:
- **AI Chat:** Natural language → SQL → formatted results
- **Recommendations:** Analyze reading history → generate search queries → fetch from Google Books

**Why SQL generation instead of tools/agents?**  
With only 2 tables, direct SQL is faster, cheaper, and more transparent. For 10+ tables, I'd use LangChain/function calling.

**Analytics Note:**  
The dashboard shows basic metrics (genre distribution, popular books, etc.). In production, you'd track engagement metrics like retention, feature usage, recommendation CTR. This is just to demonstrate business intelligence capabilities.

---

## ⚠️ Known Limitations

I know this is missing several production requirements due to time constraints:

- ❌ **No tests** (unit/integration/E2E) - critical for production
- ❌ **No rate limiting** on AI endpoints - API cost risk
- ❌ **No pagination** - will break with 1000+ books  
- ❌ **Inline styles** everywhere - hard to maintain
- ❌ **No input sanitization** - prompt injection possible
- ❌ **No caching** - repeated AI queries cost money

These weren't requested but I'm aware they're needed for a real deployment.

---

## 📋 Requirements Alignment

✅ All core requirements met:
- User registration/login
- Book CRUD operations  
- Admin dashboard with user/book management
- One-to-many relationship (User → Books)

✅ All AI requirements met:
- Natural language queries 
- AI recommendations (bonus)
- AI insights/summaries (bonus)

✅ Bonus features:
- Docker & Docker Compose setup
- Deployed (Netlify + Render + Aiven)
- ❌ Tests not implemented

---

## 🔐 OpenRouter API Key

My free key is included in the deployed version. Keep in mind, it could run out of the free credits while using. Get your own at [openrouter.ai/keys](https://openrouter.ai/keys).

Cost: ~$0.0002 per query (GPT-4o-mini)

---

## Screenshots
<img width="1334" height="629" alt="image" src="https://github.com/user-attachments/assets/a1366172-a35f-443e-bf02-d9a612a181d7" />

<img width="1180" height="632" alt="image" src="https://github.com/user-attachments/assets/f32995a2-eda0-41ba-8bc6-779d83762bd2" />

<img width="1349" height="605" alt="image" src="https://github.com/user-attachments/assets/032f55ac-bbae-4494-909f-15ef21d27158" />

<img width="1298" height="635" alt="image" src="https://github.com/user-attachments/assets/585616b6-f1b1-422a-b003-8f55650638a4" />

<img width="1329" height="630" alt="image" src="https://github.com/user-attachments/assets/37bd05c1-a968-4ae9-93d4-9e413b694038" />

etc...
---
Made with ☕ and Claude
