import { StackContext, Api, Bucket } from "sst/constructs";

export function API({ stack }: StackContext) {
  const bucket = new Bucket(stack, "Bucket", {
    notifications: {
      myNotification: {
        function: {
          handler: "packages/functions/src/upload.handler",
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
      "GET /stats": "packages/functions/src/getStats.handler",
      "GET /social/stats": "packages/functions/src/getSocialStats.handler",
      "GET /events": "packages/functions/src/getEvents.handler",
      "GET /eventstickets": "packages/functions/src/getEventsByTicketType.handler",
      "GET /attendees": "packages/functions/src/getAttendees.handler",
      "GET /eventchart": "packages/functions/src/getEventChartData.handler",
      "GET /email": "packages/functions/src/getEmailMarketing.handler",
    },
  });
  
  stack.addOutputs({
    ApiEndpoint: api.url,
    S3Bucket: bucket.bucketName,
  });
}
