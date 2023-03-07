const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const multipart = require('parse-multipart-data');

export async function handler(event: any) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  const file = event['body'];
  //console.log(JSON.stringify(event))
  //console.log(JSON.stringify(file))
  const parsedMultipart = multipart.parse(event['body'])
  console.log(parsedMultipart)
  const fileName = file['name'];
  const fileData = file['data'];

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileData,
    ACL: 'public-read',
    ContentType: 'text/csv'
  };

  try {
    const response = await s3.upload(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded to S3',
        url: response.Location
      })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to upload file to S3',
        error: error.message
      })
    };
  }
};
