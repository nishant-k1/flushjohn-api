# Leads API Documentation

## GET /leads

Retrieve leads with advanced pagination, filtering, and sorting capabilities.

### Query Parameters

| Parameter    | Type   | Default     | Description                                                        |
| ------------ | ------ | ----------- | ------------------------------------------------------------------ |
| `_id`        | string | -           | Get specific lead by ID                                            |
| `page`       | number | 1           | Page number (must be > 0)                                          |
| `limit`      | number | 10          | Items per page (1-100)                                             |
| `sortBy`     | string | "createdAt" | Sort field (createdAt, leadNo, leadStatus, assignedTo, leadSource) |
| `sortOrder`  | string | "desc"      | Sort direction (asc, desc)                                         |
| `status`     | string | -           | Filter by lead status                                              |
| `assignedTo` | string | -           | Filter by assigned user                                            |
| `leadSource` | string | -           | Filter by lead source                                              |
| `search`     | string | -           | Search across name, email, phone, company                          |

### Examples

#### Basic Pagination

```
GET /leads?page=1&limit=20
```

#### Filtered Search

```
GET /leads?status=Active&assignedTo=john@example.com&page=2&limit=15
```

#### Text Search

```
GET /leads?search=john&sortBy=createdAt&sortOrder=desc
```

#### Sort by Lead Number

```
GET /leads?sortBy=leadNo&sortOrder=asc&limit=50
```

### Response Format

```json
{
  "success": true,
  "message": "Leads retrieved successfully",
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "leadNo": 1001,
      "leadStatus": "Active",
      "assignedTo": "john@example.com",
      "leadSource": "Web Lead",
      "fName": "John",
      "lName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "companyName": "Acme Corp"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 47,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false,
    "nextPage": 2,
    "prevPage": null
  },
  "filters": {
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "status": null,
    "assignedTo": null,
    "leadSource": null,
    "search": null
  }
}
```

### Performance Features

- **Database Indexing**: Optimized indexes for fast queries
- **Lean Queries**: Uses `.lean()` for better performance
- **Parallel Queries**: Count and data queries run in parallel
- **Efficient Sorting**: Sorts by creation date by default
- **Text Search**: Case-insensitive search across multiple fields

### Error Responses

#### Invalid Pagination

```json
{
  "success": false,
  "message": "Page number must be greater than 0",
  "error": "INVALID_PAGE_NUMBER"
}
```

#### Invalid Limit

```json
{
  "success": false,
  "message": "Limit must be between 1 and 100",
  "error": "INVALID_LIMIT"
}
```

## Database Indexes

The following indexes are automatically created for optimal performance:

- `createdAt: -1` - For sorting by creation date
- `leadNo: 1` - For lead number lookups
- `leadStatus: 1` - For filtering by status
- `assignedTo: 1` - For filtering by assigned user
- `leadSource: 1` - For filtering by source
- `createdAt: -1, leadStatus: 1` - Compound index for common queries
- `assignedTo: 1, leadStatus: 1` - Compound index for user-specific queries
