# Backend Development - Interactive Presentation

## Slide Configuration
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Backend Development: Node.js & Express with AI</title>
    <meta charset=\"utf-8\">
    <style>
      @import url(https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz);
      @import url(https://fonts.googleapis.com/css?family=Droid+Serif:400,700,400italic);
      @import url(https://fonts.googleapis.com/css?family=Ubuntu+Mono:400,700,400italic);
      body { font-family: 'Droid Serif'; }
      h1, h2, h3 { font-family: 'Yanone+Kaffeesatz'; font-weight: normal; }
      .remark-code, .remark-inline-code { font-family: 'Ubuntu Mono'; }
      .inverse { background: #272822; color: #777872; text-shadow: 0 0 20px #333; }
      .inverse h1, .inverse h2 { color: #f3f3f3; line-height: 0.8em; }
    </style>
  </head>
  <body>
    <textarea id=\"source\">
```

---

class: center, middle, inverse

# Backend Development
## Building Robust Server Applications with AI

### Module 5: Node.js, Express & RESTful APIs

---

## Server-Side Revolution 🚀

.center[
### Traditional Backend vs AI-Enhanced Backend

**Before:** Manual API design, boilerplate code, debugging nightmares

**After:** AI-generated endpoints, automatic validation, intelligent error handling
]

--

.center[.large[
**Goal: Build production-ready backend systems**
]]

---

## Your Backend Journey 🎯

### By the end of this module, you will:

1. **Master Node.js** - Asynchronous server programming with AI assistance
2. **Build Express APIs** - RESTful endpoints with AI-generated code
3. **Implement Authentication** - Secure user systems with best practices
4. **Handle Data Validation** - Robust input processing with AI
5. **Deploy Applications** - Production-ready server deployment

---

class: inverse

## Node.js Fundamentals 🟢

### Server-Side JavaScript with AI

#### Basic Server Setup
```javascript
// AI-generated Express server foundation
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// AI-suggested security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## Express.js Mastery ⚡

### Building RESTful APIs with AI

#### AI-Generated CRUD Operations
```javascript
// AI creates complete resource controller
class UserController {
  // GET /api/users
  static async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      
      const filter = search ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      } : {};

      const users = await User.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-password')
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(filter);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
```

---

## Middleware Architecture 🔧

### AI-Enhanced Request Processing

#### Authentication Middleware
```javascript
// AI-generated JWT authentication
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AI-suggested authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};
```

---

class: center, middle

## API Development Challenge 🛠️

### Build a Complete Task Management API

**Endpoints to Implement:**
- User authentication (register, login, logout)
- Task CRUD operations
- Project management
- File upload handling
- Search and filtering

**AI Assistance:**
- Generate endpoint controllers
- Create validation schemas
- Implement error handling
- Add comprehensive logging

**Time:** 45 minutes

---

## Data Validation Excellence ✅

### AI-Powered Input Processing

#### Comprehensive Validation Schema
```javascript
// AI-generated validation with Joi
const Joi = require('joi');

const userValidationSchema = {
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters'
      }),
    
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    
    firstName: Joi.string()
      .min(1)
      .max(50)
      .required()
      .trim(),
    
    lastName: Joi.string()
      .min(1)
      .max(50)
      .required()
      .trim()
  })
};

// AI-suggested validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};
```

---

## Error Handling Mastery 🛡️

### Comprehensive Error Management

#### AI-Generated Error Classes
```javascript
// Custom error classes for better error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const value = Object.keys(err.keyValue)[0];
    const message = `${value} already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ValidationError(message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

class: inverse

## File Upload Handling 📁

### AI-Enhanced File Management

#### Secure File Upload
```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// AI-generated secure file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // AI-suggested file type validation
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload endpoint
app.post('/api/upload', 
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Save file info to database
      const fileRecord = await File.create({
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user._id
      });

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: fileRecord._id,
          originalName: fileRecord.originalName,
          size: fileRecord.size
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);
```

---

## API Documentation 📚

### Automated Documentation with AI

#### Swagger/OpenAPI Integration
```javascript
// AI-generated API documentation
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'A comprehensive task management system API'
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js'], // paths to files containing OpenAPI definitions
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 */
```

---

## Testing Backend APIs 🧪

### AI-Generated Test Suites

#### Comprehensive API Testing
```javascript
// AI-created test suite
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return validation error for invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should not register user with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });
});

// Performance testing
describe('API Performance', () => {
  it('should respond to health check within 100ms', async () => {
    const start = Date.now();
    
    await request(app)
      .get('/api/health')
      .expect(200);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

---

class: center, middle

## Real-World Integration 🌍

### Connect Frontend to Backend

**Complete Stack Integration:**
- Authentication flow with JWT
- Real-time data updates
- File upload and download
- Error handling and user feedback
- Performance optimization

**AI Assistance:**
- Generate API client code
- Create authentication guards
- Implement error boundaries
- Optimize data fetching

**Time:** 50 minutes

---

## Database Integration Patterns 🗄️

### AI-Enhanced Data Layer

#### Repository Pattern Implementation
```javascript
// AI-generated repository pattern
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, populate = '') {
    return this.model.findById(id).populate(populate);
  }

  async findOne(filter, populate = '') {
    return this.model.findOne(filter).populate(populate);
  }

  async find(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      limit = 20,
      skip = 0,
      populate = ''
    } = options;

    return this.model
      .find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate(populate);
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async findActiveUsers() {
    return this.find({ isActive: true });
  }
}
```

---

## Environment Configuration 🔧

### AI-Optimized Environment Management

#### Configuration Best Practices
```javascript
// AI-generated environment configuration
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/taskmanager',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@taskmanager.com'
  },

  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024,
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || 
      ['image/jpeg', 'image/png', 'application/pdf'],
    destination: process.env.UPLOAD_DESTINATION || './uploads'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};

module.exports = config;
```

---

class: inverse

## Production Deployment 🚀

### AI-Assisted Deployment Strategies

#### Docker Configuration
```dockerfile
# AI-generated Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
```

#### CI/CD Pipeline
```yaml
# AI-generated GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        DATABASE_URL: mongodb://localhost:27017/test
        JWT_SECRET: test-secret
    
    - name: Run security audit
      run: npm audit --audit-level high

  deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        # Deploy script here
        echo "Deploying to production..."
```

---

class: center, middle

## Performance Optimization 📈

### AI-Enhanced Server Performance

**Optimization Areas:**
- Database query optimization
- Caching strategies (Redis)
- Load balancing configuration
- Memory leak detection
- API response time monitoring

**AI Assistance:**
- Identify bottlenecks automatically
- Generate caching strategies
- Optimize database queries
- Monitor and alert on performance

**Time:** 30 minutes

---

class: center, middle, inverse

## Production-Ready Backend Systems 💪

### You've Built Robust Server Applications

**You Can Now:**
- Create scalable Node.js/Express applications
- Implement secure authentication and authorization
- Build comprehensive REST APIs
- Handle file uploads and data validation
- Deploy to production environments

**Next:** Module 6 - Database Management
*Designing and optimizing data storage*

--

.large[**Questions about backend development?**]

---

```html
    </textarea>
    <script src=\"https://remarkjs.com/downloads/remark-latest.min.js\"></script>
    <script>
      var slideshow = remark.create({
        ratio: '16:9',
        highlightStyle: 'github',
        highlightLines: true,
        countIncrementalSlides: false
      });
    </script>
  </body>
</html>
```