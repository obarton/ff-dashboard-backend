import { GetFacebookFollowersQuery, GetTikTokFollowersQuery } from "@dashboard-backend/core/sqlQueries";

const mysql = require('mysql2/promise');

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const [fbFollowersresult] = await connection.execute(GetFacebookFollowersQuery);
    const [tikTokFollowersResult] = await connection.execute(GetTikTokFollowersQuery);
    console.log(fbFollowersresult, null, 2)

    const result = {
      facebook: fbFollowersresult,
      tiktok: tikTokFollowersResult
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
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