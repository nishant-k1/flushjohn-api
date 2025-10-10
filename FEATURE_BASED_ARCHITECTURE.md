# Feature-Based Architecture - FlushJohn API

## 📁 **New Folder Structure**

The FlushJohn API has been refactored from a **layered architecture** to a **feature-based architecture** for better scalability and maintainability.

## **Directory Structure**

```
/flushjohn-api
  /features                         # Feature modules
    /leads
      /routes                       # leads.js
      /models                       # Leads/
      /sockets                      # leads.js
      index.js                      # Barrel export
      
    /quotes
      /routes                       # quotes.js
      /models                       # Quotes/
      /templates                    # email/, pdf/
      index.js                      # Barrel export
      
    /customers
      /routes                       # customers.js
      /models                       # Customers/
      index.js                      # Barrel export
      
    /salesOrders
      /routes                       # salesOrders.js
      /models                       # SalesOrders/
      /templates                    # email/, pdf/
      index.js                      # Barrel export
      
    /vendors
      /routes                       # vendors.js
      /models                       # Vendors/
      index.js                      # Barrel export
      
    /jobOrders
      /routes                       # jobOrders.js
      /models                       # JobOrders/
      /templates                    # email/, pdf/
      index.js                      # Barrel export
      
    /blogs
      /routes                       # blogs.js
      /models                       # Blogs/
      index.js                      # Barrel export
      
    /auth
      /routes                       # auth.js, users.js
      /models                       # User/
      /middleware                   # auth.js (JWT auth)
      index.js                      # Barrel export
      
  /routes                           # Cross-cutting routes
    index.js                        # API root route
    file-upload.js                  # File upload handling
    pdfAccess.js                    # PDF access control
    pdfCleanup.js                   # PDF cleanup
    
  /services                         # Cross-cutting services
    alertService.js                 # Alert notifications
    emailService.js                 # Email sending
    pdfService.js                   # PDF generation
    s3Service.js                    # AWS S3 operations
    
  /middleware                       # Cross-cutting middleware
    validateProducts.js             # Product validation
    
  /lib                              # Core libraries
    /dbConnect                      # Database connection
    /socketConnect                  # Socket.io setup
    
  /jobs                             # Scheduled jobs
    pdfCleanup.js                   # PDF cleanup job
    
  /templates                        # Cross-cutting templates
    /utils                          # Template utilities
      safeValue.js                  # Safe value helpers
      
  /utils                            # Utility functions
  /constants                        # Application constants
  /public                           # Static assets
  app.js                            # Express app setup
  package.json
```

## **Import Patterns**

### **Feature Entry Point (index.js)**
```javascript
// features/leads/index.js
module.exports = {
  routes: require('./routes/leads'),
  model: require('./models/Leads'),
  socket: require('./sockets/leads'),
};
```

### **App.js Registration**
```javascript
// Before (Layered)
import leadsRouter from "./routes/leads.js";
app.use("/leads", leadsRouter);

// After (Feature-Based)
import leadsFeature from "./features/leads/index.js";
const leadsRouter = leadsFeature.routes;
app.use("/leads", leadsRouter);
```

### **Within Same Feature (Relative Imports)**
```javascript
// In features/leads/routes/leads.js
import Leads from "../models/Leads/index.js";
```

### **Cross-Cutting Services (Absolute-ish Paths)**
```javascript
// In features/leads/routes/leads.js
import alertService from "../../../services/alertService.js";
import validateAndRecalculateProducts from "../../../middleware/validateProducts.js";
```

### **Cross-Feature Dependencies**
```javascript
// In features/salesOrders/routes/salesOrders.js
import Customers from "../../customers/models/Customers/index.js";
```

### **Templates**
```javascript
// In features/quotes/templates/pdf/index.js
import { flushjohn } from "../../../../constants/index.js";
import { safeValue } from "../../../../templates/utils/safeValue.js";
```

## **Benefits**

1. **🎯 Colocation**: All lead-related code (routes, models, sockets) in one place
2. **🔍 Easier Discovery**: Find everything about quotes in `/features/quotes`
3. **♻️ Clear Separation**: Cross-cutting services vs feature-specific logic
4. **📦 Scalability**: Add new features without touching existing ones
5. **🧪 Testing**: Test features in isolation
6. **👥 Team Collaboration**: Teams can own specific features
7. **🔐 Security**: Auth is a clear, isolated feature

## **Feature Module Breakdown**

### **Leads Feature**
- Routes: CRUD for leads
- Model: Lead schema & database operations
- Sockets: Real-time lead updates
- Dependencies: alertService (cross-cutting)

### **Quotes Feature**
- Routes: CRUD for quotes
- Model: Quote schema
- Templates: Email & PDF generation
- Dependencies: validateProducts (cross-cutting)

### **Customers Feature**  
- Routes: CRUD for customers
- Model: Customer schema

### **Sales Orders Feature**
- Routes: CRUD for sales orders
- Model: SalesOrder schema
- Templates: Email & PDF generation
- Dependencies: Customers model (cross-feature)

### **Vendors Feature**
- Routes: CRUD for vendors
- Model: Vendor schema

### **Job Orders Feature**
- Routes: CRUD for job orders
- Model: JobOrder schema
- Templates: Email & PDF generation

### **Blogs Feature**
- Routes: CRUD for blogs
- Model: Blog schema
- Dependencies: utils.generateSlug (cross-cutting)

### **Auth Feature**
- Routes: Authentication & user management
- Model: User schema
- Middleware: JWT authentication
- Complete auth system in one feature

## **Cross-Cutting Modules**

### **Services** (Used by multiple features)
- `alertService` - Notifications
- `emailService` - Email sending
- `pdfService` - PDF generation
- `s3Service` - AWS S3 operations

### **Middleware** (Used by multiple features)
- `validateProducts` - Product validation for quotes, sales orders, job orders

### **Templates** (Shared utilities)
- `utils/safeValue` - Safe value extraction for PDFs

## **Migration Complete** ✅

All API routes, models, templates, and sockets have been successfully migrated to the feature-based structure.

