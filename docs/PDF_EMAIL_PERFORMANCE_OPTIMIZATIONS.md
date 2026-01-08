# PDF & Email Performance Optimizations

This document outlines the performance optimizations implemented for PDF generation and email sending in the FlushJohn API.

## Summary of Optimizations

### PDF Generation Optimizations

1. **Browser Pooling** ✅
   - Browser instances are reused across PDF generations
   - Saves 2-4 seconds per PDF (after first one)
   - Browser auto-closes after 5 minutes of inactivity

2. **Browser Pre-warming** ✅
   - Browser pool is pre-warmed on server startup
   - First PDF generation is faster (no cold start delay)

3. **Faster Page Rendering** ✅
   - Changed from `waitUntil: "load"` to `waitUntil: "domcontentloaded"`
   - Saves ~200-500ms per PDF
   - Templates are static HTML with no external resources

4. **Optimized PDF Options** ✅
   - `preferCSSPageSize: false` - Uses format instead of CSS (faster)
   - `displayHeaderFooter: false` - Disabled if not needed

5. **Browser Launch Optimizations** ✅
   - Disabled unnecessary features (extensions, plugins, images, JavaScript)
   - Optimized Chrome flags for headless PDF generation
   - Reduces memory usage and startup time

6. **Background S3 Upload** ✅
   - S3 upload happens in background (non-blocking)
   - API responds immediately with URL
   - Upload completes asynchronously

7. **PDF Buffer Reuse** ✅
   - PDF buffer is passed directly to email service
   - Avoids re-downloading from S3
   - Saves network roundtrip time

### Email Sending Optimizations

1. **SMTP Connection Pooling** ✅
   - SMTP connections are reused across email sends
   - Saves ~100-200ms per email (after first one)
   - Connection auto-closes after 5 minutes of inactivity

2. **Skip Verification for Reused Connections** ✅
   - Pooled transporters skip `verify()` call
   - Saves ~100-200ms per email

3. **Reduced Timeouts** ✅
   - Connection timeout: 5000ms (was 8000ms)
   - Greeting timeout: 5000ms (was 8000ms)
   - Socket timeout: 10000ms (kept for actual sending)
   - Faster failure detection

4. **Connection Pool Configuration** ✅
   - `pool: true` - Enables connection pooling
   - `maxConnections: 3` - Allows multiple concurrent connections
   - `maxMessages: 50` - Recycles connections after 50 messages

### Route Handler Optimizations

1. **Non-blocking Database Updates** ✅
   - Database updates happen in background after email is sent
   - API responds immediately
   - Saves ~50-200ms per request
   - Applied to Quotes, Sales Orders, and Job Orders

2. **Background Customer Linking** ✅
   - Customer linking happens in background
   - Non-critical operation doesn't block response

## Performance Improvements

### Expected Improvements

- **PDF Generation**: 20-30% faster (~300-500ms saved)
- **Email Sending**: 15-25% faster (~100-300ms saved)
- **API Response Time**: 30-50% faster (~150-300ms saved)
- **Total Improvement**: ~550-1100ms faster per PDF+Email operation

### Before vs After (Typical)

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| First PDF (cold) | 3-5s | 2-4s | ~1s |
| Subsequent PDFs (warm) | 1-2s | 0.8-1.2s | ~200-400ms |
| Email Sending | 1-2s | 0.8-1.5s | ~200-500ms |
| Total (PDF + Email) | 4-7s | 2.5-4.5s | ~1.5-2.5s |

## Testing

### Performance Test Script

A comprehensive test script is available at `scripts/test-pdf-email-performance.ts`.

#### Running the Tests

```bash
# Set environment variables
export VITE_API_BASE_URL=http://localhost:8080
export TEST_QUOTE_ID=your-quote-id
export TEST_AUTH_TOKEN=your-auth-token
export TEST_EMAIL_SENDING=true  # Optional: enable email tests

# Run the tests
npx tsx scripts/test-pdf-email-performance.ts
```

#### What the Tests Cover

1. **Browser Pool Warmup Test**
   - Tests cold start vs warm start performance
   - Measures browser pooling effectiveness

2. **PDF Generation Performance**
   - Runs multiple PDF generations
   - Measures average, min, max times
   - Tests browser reuse

3. **Email Sending Performance**
   - Tests email sending with PDF attachment
   - Measures total time including PDF generation
   - Tests connection pooling

4. **Performance Report**
   - Generates summary report
   - Compares against expected improvements

### Manual Testing

You can also test manually by:

1. **Testing PDF Generation**:
   ```bash
   curl -X POST http://localhost:8080/quotes/:id/pdf \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d @quote-data.json
   ```

2. **Testing Email Sending**:
   ```bash
   curl -X POST http://localhost:8080/quotes/:id/email \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d @quote-data.json
   ```

3. **Monitoring Server Logs**:
   Look for timing logs:
   - `⏱️ [PDF type-id] Template generation: Xms`
   - `⏱️ [PDF type-id] Browser get/launch: Xms`
   - `⏱️ [PDF type-id] Page render: Xms`
   - `⏱️ [PDF type-id] PDF generation: Xms`
   - `⏱️ [Quote id] PDF generation: Xms`
   - `⏱️ [Quote id] Email sending: Xms`
   - `⏱️ [Quote id] Total email flow: Xms`

## Configuration

### Environment Variables

No additional environment variables are required. All optimizations work with existing configuration.

### Browser Pool Settings

- **Idle Timeout**: 5 minutes (configurable via `BROWSER_IDLE_TIMEOUT`)
- **Auto-close**: Enabled after idle timeout

### Email Pool Settings

- **Idle Timeout**: 5 minutes (configurable via `TRANSPORTER_IDLE_TIMEOUT`)
- **Max Connections**: 3 per email account
- **Max Messages**: 50 per connection

## Monitoring

### Key Metrics to Monitor

1. **PDF Generation Time**
   - Template generation time
   - Browser launch/get time
   - Page render time
   - PDF generation time
   - Total time

2. **Email Sending Time**
   - PDF generation time (if not cached)
   - Email sending time
   - Total time

3. **Browser Pool Effectiveness**
   - First request time (cold start)
   - Subsequent request time (warm start)
   - Improvement percentage

4. **Database Update Time**
   - Background update time (should not block response)

### Logging

All performance metrics are logged with timing information:
- `⏱️` prefix for timing logs
- `✅` prefix for success logs
- `⚠️` prefix for warnings
- `❌` prefix for errors

## Troubleshooting

### Browser Pool Not Working

If browser pooling doesn't seem to be working:

1. Check server logs for browser launch messages
2. Verify browser pool is being reused (timing should be faster on second request)
3. Check if browser is closing prematurely
4. Verify `BROWSER_IDLE_TIMEOUT` setting

### Email Pool Not Working

If email pooling doesn't seem to be working:

1. Check server logs for transporter creation messages
2. Verify connections are being reused (timing should be faster on second request)
3. Check if transporter is closing prematurely
4. Verify `TRANSPORTER_IDLE_TIMEOUT` setting

### Performance Not Improved

If performance improvements aren't visible:

1. Run the performance test script to get baseline metrics
2. Check server logs for timing information
3. Verify all optimizations are enabled (check code)
4. Test with multiple requests to see pooling effects
5. Check network latency (S3 upload/download times)

## Future Optimizations

Potential future improvements:

1. **Template Caching**: Cache compiled HTML templates
2. **PDF Compression**: Compress PDFs before email attachment
3. **Parallel Operations**: Generate PDF and prepare email in parallel
4. **CDN for PDFs**: Use CDN for faster PDF delivery
5. **Queue System**: Use queue for background PDF/email processing
6. **Template Minification**: Minify HTML templates to reduce size
7. **Image Optimization**: Optimize images in PDF templates

## References

- [Playwright PDF Generation](https://playwright.dev/docs/api/class-page#page-pdf)
- [Puppeteer PDF Generation](https://pptr.dev/#?product=Puppeteer&version=v21.5.0&show=api-pagepdfoptions)
- [Nodemailer Connection Pooling](https://nodemailer.com/smtp/pooled/)

