const { S3Client, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

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

  try {
    const command = new GetBucketCorsCommand({ Bucket: 'versatile-canister-ttmo2x' });
    const res = await s3Client.send(command);
    console.log(JSON.stringify(res.CORSRules, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
