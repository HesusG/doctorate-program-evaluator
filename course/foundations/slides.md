# Foundations - Interactive Presentation

## Slide Configuration
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Foundations: Setting Up Your AI-Enhanced Development Environment</title>
    <meta charset=\"utf-8\">
    <style>
      @import url(https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz);
      @import url(https://fonts.googleapis.com/css?family=Droid+Serif:400,700,400italic);
      @import url(https://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700,400italic);

      body { font-family: 'Droid Serif'; }
      h1, h2, h3 {
        font-family: 'Yanone Kaffeesatz';
        font-weight: normal;
      }
      .remark-code, .remark-inline-code { font-family: 'Ubuntu Mono'; }
      .inverse {
        background: #272822;
        color: #777872;
        text-shadow: 0 0 20px #333;
      }
      .inverse h1, .inverse h2 {
        color: #f3f3f3;
        line-height: 0.8em;
      }
      .red { color: #fa0000; }
      .blue { color: #0066cc; }
      .green { color: #00aa00; }
      .large { font-size: 2em; }
      .medium { font-size: 1.5em; }
      .small { font-size: 0.8em; }
      .center { text-align: center; }
      .right { text-align: right; }
      .left { text-align: left; }
      .highlight { background-color: #ffff00; }
      .code-small .remark-code { font-size: 0.7em; }
    </style>
  </head>
  <body>
    <textarea id=\"source\">
```

---

class: center, middle, inverse

# Foundations
## Building Your AI-Enhanced Development Environment

### Module 2: Professional Setup for Maximum Productivity

---

## The Foundation Matters 🏗️

.center[
### Traditional Setup vs AI-Optimized Environment

**Before:** Fragmented tools, manual processes, context switching

**After:** Integrated workflow, AI assistance at every step, seamless productivity
]

--

.center[.large[
**Goal: 90% efficiency in environment setup**
]]

---

## Your Development Transformation 🎯

### By the end of this module, you will:

1. **Configure Complete Environment** - All tools working seamlessly together
2. **Integrate Claude Code** - AI assistance in your daily workflow
3. **Master Version Control** - Git workflows optimized for AI collaboration
4. **Organize Projects** - Professional structure and file management
5. **Troubleshoot Setup Issues** - Independent problem resolution

--

.center[.medium[
**Time Investment:** 8-10 hours over 1-2 weeks
]]

---

class: inverse

## Essential Development Tools 🛠️

### The Modern Developer Toolkit

.left-column[
### Core Tools
- **VS Code**: Primary editor with AI extensions
- **Git**: Version control with AI commit messages
- **Node.js**: Runtime for our projects
- **Terminal**: Command line mastery
]

.right-column[
### AI Integration
- **Claude Code**: Primary AI assistant
- **GitHub Copilot**: Code completion (optional)
- **AI Documentation**: Automated docs generation
- **Smart Debugging**: AI-assisted troubleshooting
]

---

## VS Code: Your AI Command Center 💻

### Essential Extensions for AI Development

```
# Must-Have Extensions
- Claude Code Integration
- GitLens (Git visualization)
- Prettier (Code formatting)
- ESLint (Code quality)
- Live Server (Web development)
- REST Client (API testing)
```

--

### Workspace Configuration

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "git.enableSmartCommit": true,
  "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

---

## Git Workflows for AI Development 📚

### Traditional Git vs AI-Enhanced Git

.left-column[
### Traditional Workflow
```bash
git add .
git commit -m "fix bug"
git push
```
]

.right-column[
### AI-Enhanced Workflow
```bash
git add .
# AI generates descriptive commit
git commit -m "$(ai-commit-msg)"
# AI reviews changes
git push
```
]

--

.center[
### Live Demo: Setting Up Git with AI Assistance
]

---

## Project Structure Best Practices 📁

### AI-Optimized Directory Layout

```
my-project/
├── .claude/           # AI context and settings
├── src/
│   ├── components/
│   ├── utils/
│   └── main.js
├── tests/
├── docs/
│   ├── ai-decisions.md
│   └── README.md
├── .gitignore
├── package.json
└── CLAUDE.md          # AI collaboration notes
```

--

### Why This Structure Works
- **Clear separation** of concerns
- **AI context preservation** in .claude/
- **Documentation-first** approach
- **Scalable** for team collaboration

---

class: center, middle

## Hands-On Setup 🔧

### Your Turn: Environment Configuration

**Task:** Set up your complete development environment

**Steps:**
1. Install VS Code with essential extensions
2. Configure Git with AI commit templates
3. Create your first AI-optimized project structure
4. Test Claude Code integration

**Time:** 30 minutes

---

## Command Line Mastery 💪

### Essential Commands for AI Development

#### Navigation and File Management
```bash
# Quick navigation
cd ~/projects
mkdir new-ai-project
code .  # Open in VS Code

# File operations with AI assistance
touch README.md
echo "# AI Project" > README.md
```

#### Git Operations
```bash
# AI-enhanced git workflow
git status
git add --all
git commit -m "$(claude-commit-message)"
git push origin main
```

---

## Environment Variables and Security 🔐

### Secure Configuration Management

#### .env File Structure
```bash
# Database
DATABASE_URL=mongodb://localhost:27017/myapp

# API Keys (Never commit these!)
CLAUDE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Application Settings
NODE_ENV=development
PORT=3000
```

--

#### .gitignore Essentials
```
# Dependencies
node_modules/

# Environment variables
.env
.env.local

# AI cache
.claude/cache/

# IDE
.vscode/settings.json
```

---

## AI Integration Patterns 🤖

### Claude Code in Your Daily Workflow

#### Morning Routine
1. **Project Context**: Load yesterday's work into Claude Code
2. **Daily Planning**: AI-assisted task prioritization
3. **Code Review**: AI analysis of pending changes

#### Development Loop
1. **Plan Feature**: Use Claude Code plan mode
2. **Generate Code**: AI-assisted implementation
3. **Test & Debug**: AI-powered troubleshooting
4. **Document**: Auto-generated documentation

#### End of Day
1. **Commit Changes**: AI-generated commit messages
2. **Update Documentation**: AI-assisted updates
3. **Plan Tomorrow**: AI analysis of next priorities

---

class: inverse

## Troubleshooting Common Issues ⚠️

### Setup Problems and Solutions

#### Node.js Installation Issues
```bash
# Check installation
node --version
npm --version

# Fix path issues (Windows)
npm config set prefix "C:\\nodejs"

# Fix permissions (Mac/Linux)
sudo chown -R $(whoami) ~/.npm
```

#### Git Configuration Problems
```bash
# Set up Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# SSH key setup
ssh-keygen -t ed25519 -C "your.email@example.com"
```

---

## Performance Optimization 🚀

### Making Your Environment Lightning Fast

#### VS Code Performance
```json
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

#### Terminal Optimization
```bash
# Faster command history search
echo 'set completion-ignore-case on' >> ~/.inputrc

# Useful aliases
alias ll='ls -la'
alias gs='git status'
alias gp='git push'
```

---

## Team Collaboration Setup 👥

### Standardizing Team Environments

#### Shared Configuration Files
```json
// .vscode/settings.json (team settings)
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "eslint.enable": true,
  "prettier.enable": true
}
```

#### Team AI Guidelines
```markdown
# Team AI Usage Guidelines

## Claude Code Best Practices
- Always review AI-generated code
- Document AI-assisted decisions
- Share effective prompts with team
- Use consistent prompt templates
```

---

class: center, middle

## Environment Testing 🧪

### Validation Exercise

**Challenge:** Create a complete project from scratch using your new environment

**Requirements:**
- Initialize Git repository
- Set up proper project structure  
- Configure AI tools integration
- Create sample application
- Deploy to GitHub

**Time:** 45 minutes

---

## Advanced Configuration 🎛️

### Power User Setup

#### Custom AI Prompts
```javascript
// .claude/templates/commit-message.js
module.exports = {
  generate: (changes) => {
    return `feat: ${changes.summary}

${changes.details}

🤖 Generated with Claude Code assistance`;
  }
};
```

#### Automated Workflows
```yaml
# .github/workflows/ai-review.yml
name: AI Code Review
on: [pull_request]
jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: AI Code Analysis
        run: claude-code review --diff
```

---

## Workspace Management 💼

### Multiple Project Organization

#### Project Switching
```bash
# Quick project switching
alias projects='cd ~/development && ls'
alias work='cd ~/development/work-projects'
alias personal='cd ~/development/personal-projects'

# AI context switching
claude-context switch project-name
```

#### Environment Profiles
```bash
# Development profiles
export DEV_PROFILE="frontend"  # or "backend", "fullstack"
export AI_ASSISTANCE_LEVEL="high"  # or "medium", "minimal"
```

---

class: center, middle

## Backup and Recovery 💾

### Protecting Your Setup

**Essential Backup Strategy:**
- Configuration files in Git
- VS Code settings sync
- AI conversation history
- Project templates and snippets

**Recovery Plan:**
- Automated restoration scripts
- Cloud-based configuration backup
- Team shared setup repositories

---

## Mobile Development Setup 📱

### Extending to Mobile Development

#### React Native Environment
```bash
# Install React Native CLI
npm install -g react-native-cli

# Set up Android development
# Download Android Studio
# Configure environment variables
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools
```

#### AI Mobile Development
- Claude Code for React Native
- AI-assisted mobile UI design
- Automated testing with AI
- Performance optimization guidance

---

class: center, middle

## Assessment and Next Steps 📊

### Environment Validation Checklist

- [ ] VS Code configured with AI extensions
- [ ] Git working with AI commit messages
- [ ] Claude Code integrated and tested
- [ ] Project structure template created
- [ ] Command line tools configured
- [ ] Security settings properly configured
- [ ] Team collaboration tools ready

---

## Maintenance and Updates 🔄

### Keeping Your Environment Current

#### Weekly Maintenance
```bash
# Update tools
npm update -g
git fetch --all

# Clean up
npm cache clean --force
git gc --prune=now
```

#### Monthly Reviews
- Extension updates and new AI tools
- Configuration optimization
- Security audit and updates
- Performance monitoring and tuning

---

class: center, middle, inverse

## Ready for Development! 🚀

### Your Foundation is Set

**Next:** Module 3 - JavaScript
*Modern JavaScript development with AI assistance*

--

.large[**Questions about your setup?**]

---

```html
    </textarea>
    <script src=\"https://remarkjs.com/downloads/remark-latest.min.js\"></script>
    <script>
      var slideshow = remark.create({
        ratio: '16:9',
        highlightStyle: 'github',
        highlightLines: true,
        countIncrementalSlides: false,
        navigation: {
          scroll: false
        }
      });
    </script>
  </body>
</html>
```

## Presentation Notes

### Delivery Instructions

#### Slide Timing (90-minute session)
- **Introduction & Overview**: 10 minutes (slides 1-3)
- **Tool Overview**: 15 minutes (slides 4-6)
- **Hands-On Setup**: 30 minutes (slides 7-9)
- **Advanced Configuration**: 20 minutes (slides 10-15)
- **Testing & Validation**: 10 minutes (slides 16-17)
- **Wrap-up & Q&A**: 5 minutes (slides 18-20)

#### Interactive Elements
- **Live Setup**: Actual environment configuration with students
- **Troubleshooting Session**: Real problem-solving with common issues
- **Pair Programming**: Students help each other with setup challenges
- **Tool Demonstrations**: Show actual VS Code, Git, and Claude Code integration

#### Required Materials
- **Setup Checklist**: Printable validation checklist for students
- **Configuration Files**: Sample configs for download
- **Troubleshooting Guide**: Common issues and solutions reference
- **Next Module Preview**: Introduction to JavaScript module