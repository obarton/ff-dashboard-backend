import { StackContext, Api, Bucket } from "sst/constructs";

export function API({ stack }: StackContext) {
  const bucket = new Bucket(stack, "Bucket", {
    notifications: {
      myNotification: {
        function: {
          handler: "packages/functions/src/uploadNotification.handler",
        },
        events: ["object_created"],
      },
    },
  });

  bucket.attachPermissions(["s3"])

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        permissions: [bucket]
      }
    },
    routes: {
      "GET /stats": "packages/functions/src/lambda.handler",
      "POST /upload": "packages/functions/src/upload.handler",
    },
  });
  stack.addOutputs({
    ApiEndpoint: api.url,
    S3Bucket: bucket.bucketName,
  });
}
