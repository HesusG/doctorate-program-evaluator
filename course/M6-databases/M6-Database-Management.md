# M6 - Database Management - Interactive Presentation

## Slide Configuration
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Database Management: MongoDB & Data Modeling with AI</title>
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

# Database Management
## MongoDB & Data Modeling with AI

### Module 6: Scalable Data Storage Solutions

---

## Data Revolution 🗄️

.center[
### Traditional Databases vs AI-Enhanced Data Management

**Before:** Manual schema design, complex queries, performance guesswork

**After:** AI-optimized schemas, intelligent queries, automated optimization
]

--

.center[.large[
**Goal: Master modern database design and optimization**
]]

---

## Your Database Journey 🎯

### By the end of this module, you will:

1. **Design MongoDB Schemas** - Optimal data models with AI assistance
2. **Write Complex Queries** - Aggregation pipelines with AI generation
3. **Optimize Performance** - Indexing and query optimization
4. **Ensure Data Security** - Access control and validation
5. **Scale Databases** - Replication and sharding strategies

---

class: inverse

## MongoDB Fundamentals 🍃

### Document-Based Data Storage

#### AI-Generated Schema Design
```javascript
// AI-optimized user schema
const userSchema = new mongoose.Schema({
  // Basic user information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: {
      url: String,
      publicId: String // For Cloudinary integration
    },
    bio: { type: String, maxlength: 500 },
    location: {
      country: String,
      city: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere' // For geospatial queries
      }
    }
  },
  
  // Security and authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never include in queries by default
  },
  
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  
  // Account management
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  
  // Audit fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
  lastActiveAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});
```

---

## Advanced Querying 🔍

### AI-Powered Aggregation Pipelines

#### Complex Data Aggregation
```javascript
// AI-generated user analytics aggregation
const getUserAnalytics = async (userId, timeframe = '30d') => {
  const matchDate = new Date();
  matchDate.setDate(matchDate.getDate() - parseInt(timeframe));

  const pipeline = [
    // Match user's tasks
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: matchDate }
      }
    },
    
    // Group by completion status and priority
    {
      $group: {
        _id: {
          status: '$status',
          priority: '$priority',
          week: { 
            $week: '$createdAt' 
          }
        },
        count: { $sum: 1 },
        avgCompletionTime: {
          $avg: {
            $subtract: ['$completedAt', '$createdAt']
          }
        }
      }
    },
    
    // Reshape the data
    {
      $group: {
        _id: '$_id.week',
        tasks: {
          $push: {
            status: '$_id.status',
            priority: '$_id.priority',
            count: '$count',
            avgCompletionTime: '$avgCompletionTime'
          }
        },
        totalTasks: { $sum: '$count' }
      }
    },
    
    // Add productivity score calculation
    {
      $addFields: {
        productivityScore: {
          $multiply: [
            {
              $divide: [
                { $size: { $filter: { input: '$tasks', cond: { $eq: ['$$this.status', 'completed'] } } } },
                '$totalTasks'
              ]
            },
            100
          ]
        }
      }
    },
    
    // Sort by week
    { $sort: { _id: 1 } },
    
    // Limit results
    { $limit: 12 }
  ];

  return Task.aggregate(pipeline);
};

// AI-suggested search with full-text search
const searchTasks = async (userId, searchTerm, filters = {}) => {
  const pipeline = [
    // Text search
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        $text: { $search: searchTerm }
      }
    },
    
    // Add search score
    {
      $addFields: {
        score: { $meta: 'textScore' }
      }
    },
    
    // Apply additional filters
    ...(filters.priority ? [{ $match: { priority: filters.priority } }] : []),
    ...(filters.status ? [{ $match: { status: filters.status } }] : []),
    ...(filters.tags ? [{ $match: { tags: { $in: filters.tags } } }] : []),
    
    // Populate project information
    {
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project'
      }
    },
    
    // Sort by relevance and recency
    {
      $sort: {
        score: { $meta: 'textScore' },
        createdAt: -1
      }
    },
    
    { $limit: 50 }
  ];

  return Task.aggregate(pipeline);
};
```

---

class: center, middle

## Database Design Challenge 🏗️

### Design a Complete E-commerce Schema

**Entities to Model:**
- Users and authentication
- Products and categories
- Orders and order items
- Shopping cart
- Reviews and ratings

**AI Assistance:**
- Generate optimal schema designs
- Create validation rules
- Design efficient relationships
- Add performance indexes

**Time:** 40 minutes

---

## Performance Optimization 🚀

### AI-Enhanced Database Performance

#### Intelligent Indexing Strategy
```javascript
// AI-suggested compound indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'profile.location.coordinates': '2dsphere' });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActiveAt: -1 });

// Text search index
userSchema.index({
  username: 'text',
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  'profile.bio': 'text'
}, {
  name: 'user_text_search',
  weights: {
    username: 10,
    'profile.firstName': 5,
    'profile.lastName': 5,
    'profile.bio': 1
  }
});

// TTL index for refresh tokens
userSchema.index({ 'refreshTokens.expiresAt': 1 }, { expireAfterSeconds: 0 });

// AI-generated query optimization middleware
userSchema.pre('find', function() {
  // Exclude sensitive fields by default
  this.select('-password -refreshTokens');
});

userSchema.pre('findOne', function() {
  this.select('-password -refreshTokens');
});

// Automatic updated timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
```

---

## Data Validation Excellence ✅

### AI-Powered Data Integrity

#### Custom Validation Functions
```javascript
// AI-generated advanced validations
const mongoose = require('mongoose');

// Custom validators
const validators = {
  // Strong password validation
  strongPassword: {
    validator: function(password) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    },
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character'
  },

  // Professional email domains
  professionalEmail: {
    validator: function(email) {
      const blockedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      return !blockedDomains.includes(domain);
    },
    message: 'Please use a professional email address'
  },

  // Coordinate validation
  validCoordinates: {
    validator: function(coords) {
      if (!Array.isArray(coords) || coords.length !== 2) return false;
      const [lng, lat] = coords;
      return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
    },
    message: 'Invalid coordinates format'
  }
};

// AI-suggested schema with advanced validation
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },

  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(price) {
        return Number.isFinite(price) && price >= 0;
      },
      message: 'Price must be a valid positive number'
    }
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    validate: {
      validator: async function(categoryId) {
        const category = await mongoose.model('Category').findById(categoryId);
        return category && category.isActive;
      },
      message: 'Invalid or inactive category'
    }
  },

  inventory: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative']
    }
  }
});

// AI-generated pre-save validation
productSchema.pre('save', async function(next) {
  // Check for duplicate names in the same category
  if (this.isModified('name') || this.isModified('category')) {
    const existing = await this.constructor.findOne({
      name: this.name,
      category: this.category,
      _id: { $ne: this._id }
    });

    if (existing) {
      return next(new Error('Product name already exists in this category'));
    }
  }

  next();
});
```

---

class: inverse

## Database Security 🔒

### AI-Enhanced Data Protection

#### Access Control and Encryption
```javascript
// AI-generated security middleware
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Password hashing with salt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Sensitive data encryption
const encryptSensitiveData = (text) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Database connection security
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Security options
      ssl: true,
      sslValidate: true,
      authSource: 'admin'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// AI-suggested audit logging
const auditSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE']
  },
  collection: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});

// Audit middleware
const auditMiddleware = function(action) {
  return function(next) {
    const Audit = mongoose.model('Audit');
    
    // Log the action
    const auditLog = new Audit({
      action,
      collection: this.constructor.modelName,
      documentId: this._id,
      userId: this.modifiedBy,
      changes: this.getChanges ? this.getChanges() : undefined,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent
    });

    auditLog.save().catch(err => {
      console.error('Audit logging failed:', err);
    });

    next();
  };
};
```

---

## Real-time Data Sync 🔄

### AI-Powered Live Updates

#### Change Streams Implementation
```javascript
// AI-generated real-time data synchronization
const EventEmitter = require('events');

class DatabaseChangeStream extends EventEmitter {
  constructor() {
    super();
    this.watchers = new Map();
  }

  // Watch collection changes
  watchCollection(collectionName, pipeline = []) {
    const collection = mongoose.connection.collection(collectionName);
    
    const changeStream = collection.watch(pipeline, {
      fullDocument: 'updateLookup'
    });

    changeStream.on('change', (change) => {
      this.emit(`${collectionName}:change`, change);
      
      // Emit specific operation events
      this.emit(`${collectionName}:${change.operationType}`, change);
    });

    this.watchers.set(collectionName, changeStream);
    return changeStream;
  }

  // Watch specific document
  watchDocument(collectionName, documentId) {
    const pipeline = [
      {
        $match: {
          $or: [
            { 'fullDocument._id': new mongoose.Types.ObjectId(documentId) },
            { 'documentKey._id': new mongoose.Types.ObjectId(documentId) }
          ]
        }
      }
    ];

    return this.watchCollection(collectionName, pipeline);
  }

  // Close all watchers
  closeAll() {
    for (const [name, watcher] of this.watchers) {
      watcher.close();
      console.log(`Closed watcher for ${name}`);
    }
    this.watchers.clear();
  }
}

// Usage with Socket.IO for real-time updates
const changeStream = new DatabaseChangeStream();

// Watch user updates
changeStream.watchCollection('users');
changeStream.on('users:update', (change) => {
  const userId = change.documentKey._id;
  io.to(`user:${userId}`).emit('profile:updated', change.fullDocument);
});

// Watch task updates
changeStream.watchCollection('tasks');
changeStream.on('tasks:insert', (change) => {
  const task = change.fullDocument;
  io.to(`project:${task.projectId}`).emit('task:created', task);
});

changeStream.on('tasks:update', (change) => {
  const task = change.fullDocument;
  io.to(`project:${task.projectId}`).emit('task:updated', task);
});
```

---

class: center, middle

## Advanced Database Operations 🎯

### Complex Data Management Scenarios

**Real-World Challenges:**
- Multi-document transactions
- Data migration strategies
- Backup and recovery
- Performance monitoring
- Scaling considerations

**AI Assistance:**
- Generate migration scripts
- Optimize query performance
- Design backup strategies
- Monitor database health

**Time:** 35 minutes

---

## Database Testing 🧪

### AI-Generated Test Suites

#### Comprehensive Database Tests
```javascript
// AI-created database testing suite
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Model Tests', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    it('should reject invalid email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'SecurePass123!',
        profile: { firstName: 'Test', lastName: 'User' }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique constraints', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        profile: { firstName: 'Test', lastName: 'User' }
      };

      await new User(userData).save();
      
      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create test data
      const users = Array.from({ length: 1000 }, (_, i) => ({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'SecurePass123!',
        profile: {
          firstName: `First${i}`,
          lastName: `Last${i}`
        }
      }));

      await User.insertMany(users);
    });

    it('should perform fast text search', async () => {
      const start = Date.now();
      
      const results = await User.find({
        $text: { $search: 'user1' }
      }).limit(10);

      const duration = Date.now() - start;
      
      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should efficiently paginate results', async () => {
      const start = Date.now();
      
      const results = await User.find({})
        .sort({ createdAt: -1 })
        .skip(500)
        .limit(50);

      const duration = Date.now() - start;
      
      expect(results.length).toBe(50);
      expect(duration).toBeLessThan(50);
    });
  });
});
```

---

class: center, middle, inverse

## Database Mastery Achieved 🎯

### You've Built Scalable Data Solutions

**You Can Now:**
- Design optimal MongoDB schemas
- Write complex aggregation pipelines
- Implement robust data validation
- Ensure database security and compliance
- Optimize query performance

**Next:** Module 7 - API Development
*Creating comprehensive API systems*

--

.large[**Questions about database management?**]

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