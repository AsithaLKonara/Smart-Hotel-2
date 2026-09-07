const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

async function run() {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: 'https://t3.storageapi.dev',
    credentials: {
      accessKeyId: 'tid_MIImJRNBoZMC_coTFDIVGPl_ufaYYGTCTsTSnzstoPCLzPikUk',
      secretAccessKey: 'tsec_jyKvufy1FBtGymQQjtm8SOHO24fZ4xUpEv67mxT9OTl29qy4xBB2oBe214gyqaumc9u2jQ',
    },
    forcePathStyle: true,
  });

  const command = new PutBucketCorsCommand({
    Bucket: 'versatile-canister-ttmo2x',
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  });

  await s3Client.send(command);
  console.log('CORS configured successfully with wildcard origin!');
}

run().catch(console.error);
