import moment from "moment";

const mysql = require('mysql2/promise');

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const eventsQuery = `SELECT event_name, event_date, SUM(total_paid) as total_revenue, COUNT(*) as total_qty FROM orders
    JOIN events on orders.event_id = events.event_id
    AND order_type IN ('Free Order', 'Eventbrite Completed')
    GROUP BY events.event_id
    ORDER BY event_date ASC
    LIMIT 12`
    const [eventData, eventFields] = await connection.execute(eventsQuery);

    console.log(JSON.stringify(eventData, null, 2))
    const data = eventData.map((item: any) => {
      return {
          ...item,
          event_date: moment(item.event_date).format('MM/DD/YY')
      }
    })
  
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