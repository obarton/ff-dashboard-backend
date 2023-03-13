const mysql = require('mysql2/promise');

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const eventsQuery = `SELECT event_ticket_counts.event_id, event_data.event_name, event_data.event_date, event_ticket_counts.ticket_qty FROM
      (SELECT event_id, COUNT(*) as ticket_qty from orders o group by o.event_id) as event_ticket_counts
      JOIN
      (SELECT * from events) as event_data on event_ticket_counts.event_id = event_data.event_id
      ORDER BY event_data.event_date DESC`
    const [data, eventFields] = await connection.execute(eventsQuery);

    console.log(JSON.stringify(data, null, 2))
  
    const response = { data }

    return {
      statusCode: 200,
      body: JSON.stringify(response),
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