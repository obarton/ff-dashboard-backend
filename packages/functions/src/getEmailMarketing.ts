const client = require("@mailchimp/mailchimp_marketing");

export async function handler(event: any) {
  try {
    client.setConfig({
        apiKey: process.env.MAILCHIMP_API_KEY,
        server: "us18",
      });
      const listId = "e2e3ce9093"

      const response = await client.lists.getList(listId);
      console.log(response);
      const { stats: { member_count, open_rate, click_rate } } = response;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        subscriber_count: member_count,
        open_rate,
        click_rate
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};