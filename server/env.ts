import fs from 'fs';

export function sanitizeAndLoadEnv(): void {
  // 1. Check /app/.dev.env.json and load variables if not present in process.env
  try {
    if (fs.existsSync('/app/.dev.env.json')) {
      const devEnv = JSON.parse(fs.readFileSync('/app/.dev.env.json', 'utf8'));
      for (const [key, value] of Object.entries(devEnv)) {
        if (typeof value === 'string') {
          // If not set or starts with KEY= prefix, update it
          if (!process.env[key] || process.env[key]?.startsWith(`${key}=`)) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Notice: Could not read /app/.dev.env.json:', err);
  }

  // 2. Sanitize CLOUDINARY_URL
  if (process.env.CLOUDINARY_URL) {
    let url = process.env.CLOUDINARY_URL.trim();

    // Strip "export CLOUDINARY_URL=" or "CLOUDINARY_URL=" prefix if pasted by user
    if (url.startsWith('export CLOUDINARY_URL=')) {
      url = url.substring('export CLOUDINARY_URL='.length).trim();
    }
    if (url.startsWith('CLOUDINARY_URL=')) {
      url = url.substring('CLOUDINARY_URL='.length).trim();
    }

    // Strip wrapping quotes
    url = url.replace(/^['"]|['"]$/g, '').trim();

    if (url.startsWith('cloudinary://')) {
      process.env.CLOUDINARY_URL = url;

      // Extract credentials from cloudinary://<api_key>:<api_secret>@<cloud_name>
      try {
        const regex = /^cloudinary:\/\/([^:]+):([^@]+)@([a-zA-Z0-9_-]+)/;
        const match = url.match(regex);
        if (match) {
          const [, apiKey, apiSecret, cloudName] = match;
          if (!process.env.CLOUDINARY_API_KEY) process.env.CLOUDINARY_API_KEY = apiKey;
          if (!process.env.CLOUDINARY_API_SECRET) process.env.CLOUDINARY_API_SECRET = apiSecret;
          if (!process.env.CLOUDINARY_CLOUD_NAME) process.env.CLOUDINARY_CLOUD_NAME = cloudName;
        }
      } catch {
        // ignore regex error
      }
    } else {
      // If it's not a valid cloudinary:// protocol, delete it so the Cloudinary SDK won't crash on boot
      console.warn(
        'Warning: CLOUDINARY_URL does not start with cloudinary://. Removing invalid variable from process.env to prevent runtime crash.'
      );
      delete process.env.CLOUDINARY_URL;
    }
  }

  // 3. Clean CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  const cleanVar = (key: string) => {
    if (process.env[key]) {
      let val = process.env[key]!.trim();
      if (val.startsWith(`${key}=`)) {
        val = val.substring(`${key}=`.length).trim();
      }
      val = val.replace(/^['"]|['"]$/g, '').trim();
      process.env[key] = val;
    }
  };

  cleanVar('CLOUDINARY_CLOUD_NAME');
  cleanVar('CLOUDINARY_API_KEY');
  cleanVar('CLOUDINARY_API_SECRET');
}

// Automatically execute sanitization when this module is imported
sanitizeAndLoadEnv();
