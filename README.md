# Smartass Prompts Project

**Version 1.1 - July 28, 2025**

A comprehensive platform for sharing, evaluating, and discovering AI prompts with automated scoring and intelligent categorization.

## 🚀 Features

- **Drag & Drop Upload**: Intuitive file upload interface with validation
- **AI-Powered Evaluation**: Automatic scoring on clarity, structure, and usefulness
- **Smart Categorization**: Auto-tagging and category classification
- **Supabase Integration**: Secure data storage with Row Level Security
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Validation**: Instant feedback on form inputs

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI GPT-4 for prompt evaluation
- **File Upload**: UploadThing for secure file handling
- **Validation**: Zod for type-safe validation
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 8+
- Supabase account
- OpenAI API key
- UploadThing account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Invisi0nvisuals/smartass-prompts.git
cd smartass-prompts
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

### 4. Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Copy the contents of supabase/schema.sql
# Paste and execute in Supabase SQL Editor
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
smartass-prompts/
├── components/
│   └── PromptUploadForm.tsx    # Main upload component
├── lib/
│   ├── aiEvaluator.ts          # AI scoring logic
│   ├── supabase.ts             # Database client
│   └── utils.ts                # Utility functions
├── types/
│   └── supabase.ts             # Database types
├── docs/
│   ├── components/
│   │   └── PromptUploadForm.md # Component documentation
│   └── ai/
│       └── ScoringLogic.md     # AI evaluation docs
├── supabase/
│   └── schema.sql              # Database schema
└── app/                        # Next.js app directory
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI evaluation | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `UPLOADTHING_SECRET` | UploadThing secret key | Yes |
| `UPLOADTHING_APP_ID` | UploadThing application ID | Yes |

### Feature Flags

```bash
ENABLE_AI_EVALUATION=true      # Enable AI scoring
ENABLE_AUTO_TAGGING=true       # Enable auto-tagging
ENABLE_BATCH_PROCESSING=true   # Enable batch operations
ENABLE_CACHING=true            # Enable result caching
```

## 📊 Database Schema

### Tables

- **`prompt_metadata`**: Core prompt information and scores
- **`user_prompt_interactions`**: User engagement tracking
- **`prompt_collections`**: User-created prompt collections

### Row Level Security (RLS)

All tables implement RLS policies ensuring users can only:
- View public prompts or their own prompts
- Modify their own data
- Access appropriate interaction data

## 🤖 AI Evaluation

### Scoring Dimensions

1. **Clarity (1-10)**: How clear and unambiguous the instructions are
2. **Structure (1-10)**: Organization and formatting quality
3. **Usefulness (1-10)**: Practical value and applicability
4. **Overall (1-10)**: Comprehensive quality assessment

### Auto-Tagging

The system automatically generates relevant tags based on:
- Domain/field identification
- Task type classification
- Output format detection
- Complexity assessment

## 🔒 Security Features

- **File Validation**: Size limits (5MB) and type restrictions
- **Input Sanitization**: All user inputs are validated and sanitized
- **RLS Policies**: Database-level security enforcement
- **CORS Configuration**: Proper cross-origin request handling
- **Rate Limiting**: API endpoint protection

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Deploy**: Vercel will automatically build and deploy

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Branch Strategy

- **`main`**: Production-ready code
- **`beta`**: Staging environment for testing
- **`feature/*`**: Feature development branches

## 🧪 Testing

### Run Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

### Test Coverage

```bash
pnpm test:coverage
```

## 📚 Documentation

- [Component Documentation](./docs/components/PromptUploadForm.md)
- [AI Scoring Logic](./docs/ai/ScoringLogic.md)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Invisi0nvisuals/smartass-prompts/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Invisi0nvisuals/smartass-prompts/discussions)
- **Documentation**: [Project Wiki](https://github.com/Invisi0nvisuals/smartass-prompts/wiki)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic upload functionality
- ✅ AI evaluation system
- ✅ Supabase integration
- ✅ Documentation

### Phase 2 (Planned)
- [ ] User authentication
- [ ] Prompt browsing interface
- [ ] Search and filtering
- [ ] User profiles

### Phase 3 (Future)
- [ ] Prompt collections
- [ ] Social features (likes, comments)
- [ ] Advanced analytics
- [ ] API for third-party integrations

## 🏆 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for backend infrastructure
- Vercel for deployment platform
- The open-source community for inspiration

---

**Built with ❤️ for the AI community**
