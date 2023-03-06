const mysql = require('mysql2/promise');

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const [result, fields] = await connection.execute(`
    SELECT 
      (SELECT COUNT(*) from attendee) as attendee_count, 
      (SELECT COUNT(*) from ticket) as ticket_count,
      (SELECT SUM(online_ticket_amount) from revenue) AS total_online_ticket_revenue,
      (SELECT SUM(door_ticket_amount) from revenue) AS total_door_ticket_revenue,
      (SELECT SUM(bar_split_amount) from revenue) AS total_bar_split_revenue
    `);

    const data = result[0];
    const attendeeCount = data['attendee_count'];
    const ticketCount = data['ticket_count'];
    const totalOnlineTicketRevenue = parseFloat(data['total_online_ticket_revenue']).toFixed(2);
    const totalDoorTicketRevenue = parseFloat(data['total_door_ticket_revenue']).toFixed(2);
    const totalBarSplitRevenue = parseFloat(data['total_bar_split_revenue']).toFixed(2);
    const totalRevenue = (parseFloat(totalOnlineTicketRevenue) + parseFloat(totalDoorTicketRevenue) + parseFloat(totalBarSplitRevenue)).toFixed(2);

    const response = {
      attendee: {
        count: attendeeCount
      },
      ticket: {
        count: ticketCount
      },
      revenue: {
        online_ticket_total: totalOnlineTicketRevenue,
        door_ticket_total: totalDoorTicketRevenue,
        bar_split_total: totalBarSplitRevenue,
        total: totalRevenue
      }  
    }

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