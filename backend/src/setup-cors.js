const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function setupCORS() {
  try {
    const corsConfig = JSON.parse(fs.readFileSync('./cors-config.json', 'utf-8'));
    
    const command = new PutBucketCorsCommand({
      Bucket: process.env.S3_BUCKET,
      CORSConfiguration: corsConfig,
    });

    await s3Client.send(command);
    console.log('Successfully updated CORS configuration for S3 bucket');
  } catch (error) {
    console.error('Error updating CORS configuration:', error);
  }
}

setupCORS(); 