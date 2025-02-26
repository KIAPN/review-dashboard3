# Deployment Guide for Koala Insulation Review Dashboard

This guide provides step-by-step instructions for deploying the review dashboard to different environments.

## Preparing Your Data

Before deploying, make sure your reviews data is properly prepared:

1. Place your CSV file in the project root
2. Run the data conversion script:
   ```bash
   npm run prepare-data
   ```
   This will create JSON and CSV versions of your data in the `src/data` directory.

## Option 1: Deploying to Netlify (Recommended)

### Manual Deployment

1. Install the Netlify CLI if you haven't already:
   ```bash
   npm install -g netlify-cli
   ```

2. Build your project:
   ```bash
   npm run build
   ```

3. Deploy to Netlify:
   ```bash
   netlify deploy --prod
   ```
   - If this is your first deployment, you'll be prompted to login and select a site

### Using the Convenience Script

We've provided a convenience script that combines the build and deploy steps:

```bash
npm run deploy:netlify
```

### Using GitHub Actions

For automatic deployments when you push to your GitHub repository:

1. Create a new Netlify site and connect it to your GitHub repository
2. Add your Netlify API credentials as GitHub secrets:
   - `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
   - `NETLIFY_SITE_ID`: Your Netlify site ID

3. Push to your main branch, and GitHub Actions will automatically deploy your site

## Option 2: Using Docker

### Building and Running Locally

1. Build the Docker image:
   ```bash
   npm run docker:build
   ```

2. Run the container:
   ```bash
   npm run docker:run
   ```

3. Access your dashboard at http://localhost:8080

### Using Docker Compose

For development:

```bash
npm run compose:up
```

This will start the application in a container and make it available at http://localhost:8080.

## Option 3: Traditional Web Hosting

1. Build your project:
   ```bash
   npm run build
   ```

2. Upload the contents of the `build` directory to your web server
   - Make sure your web server is configured to handle single-page applications by redirecting all requests to index.html

## Troubleshooting

### Data Not Showing Up

- Check that your CSV file is properly formatted with the expected columns
- Verify that the data conversion script ran successfully
- Check the browser console for any errors

### Deployment Failed

- For Netlify: Check the Netlify deploy logs
- For Docker: Verify that Docker is running and that port 8080 is not in use
- Check that all required files are present in your repository
