# Setup Guide for Syllaparse

This guide will help you set up the Syllaparse project on your local machine.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Google Cloud account
- Git

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd syllaparse
```

## Step 2: Initial Setup

Run the development setup script:

```bash
./setup-dev.sh
```

This will:

- Install Python dependencies
- Install Node.js dependencies
- Set up the database

## Step 3: Google Cloud Setup

### 3.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Storage API
4. Note your Project ID

### 3.2 Create a Service Account

1. In the Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "syllaparse-service")
4. Add the following roles:
   - Storage Object Admin
   - Storage Object Viewer
5. Click "Create and Continue"
6. Skip the optional steps and click "Done"

### 3.3 Download the Service Account Key

1. Click on your newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the key file

### 3.4 Configure Credentials

Run the credentials setup script:

```bash
./setup-credentials.sh
```

This will:

- Create a `credentials/` directory
- Create a `.env` file from the example
- Provide next steps

### 3.5 Place Your Service Account Key

1. Move the downloaded JSON file to the `credentials/` folder
2. Rename it to `service-account.json`
3. Your file structure should look like:
   ```
   syllaparse/
   ├── credentials/
   │   └── service-account.json  ← Your key file here
   ├── .env                      ← Environment variables
   └── ...
   ```

### 3.6 Update Environment Variables

Edit the `.env` file and update:

```bash
# Your actual Google Cloud Project ID
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id

# Path to your service account key (should already be correct)
GOOGLE_APPLICATION_CREDENTIALS=./credentials/service-account.json

# Your bucket name (create one if needed)
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

### 3.7 Create a Storage Bucket

1. In Google Cloud Console, go to "Cloud Storage" > "Buckets"
2. Click "Create Bucket"
3. Choose a unique name
4. Select your preferred location
5. Choose "Standard" storage class
6. Set access control to "Uniform"
7. Click "Create"

## Step 4: Start the Application

### 4.1 Start the Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

The backend will be available at http://localhost:8000

### 4.2 Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

## Step 5: Verify Setup

1. Open http://localhost:3000 in your browser
2. Try uploading a PDF file
3. Check the Google Cloud Console to see if files are being uploaded

## Troubleshooting

### Common Issues

**"Permission denied" errors**

- Ensure your service account has the correct roles
- Check that the service account key file is readable

**"Bucket not found" errors**

- Verify your bucket name in the `.env` file
- Ensure the bucket exists in your Google Cloud project

**"Invalid credentials" errors**

- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to the correct file
- Verify the JSON file is valid and not corrupted

### Getting Help

- Check the API documentation at http://localhost:8000/docs
- Review the console logs for detailed error messages
- Ensure all environment variables are set correctly

## Security Notes

- Never commit your service account key to version control
- The `credentials/` folder is already in `.gitignore`
- Keep your service account key secure and don't share it
- Consider using environment-specific service accounts for production
