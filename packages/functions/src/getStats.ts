const mysql = require('mysql2/promise');

const sumCounts = (jsonArray: any[]) => {
  let sum = 0;
  for (let i = 0; i < jsonArray.length; i++) {
    sum += jsonArray[i].count;
  }
  return sum;
}

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const attendeeQuery = `SELECT attendee_status, Count(*) FROM attendees 
    GROUP BY attendee_status`
    const [attendeeResult, attendeeFields] = await connection.execute(attendeeQuery);

    console.log(JSON.stringify(attendeeResult, null, 2))
    
    const attendeeData = attendeeResult.map((record: any) => {
      return {
        status: record['attendee_status'],
        count: record['Count(*)']
      }
    });

    const salesQuery = `SELECT online_ticket_quantity, online_ticket_revenue, door_ticket_revenue FROM
    (
      SELECT SUM(q) as online_ticket_quantity, SUM(t) as online_ticket_revenue
      FROM
        (SELECT a.*, o.quantity_purchased as q, o.total_spent as t
          FROM 
          (
              SELECT *, COUNT(order_num) as quantity_purchased, SUM(total_paid) as total_spent FROM orders
              GROUP BY order_num
          ) as o
          JOIN 
          (
            SELECT *, SUM(quantity) FROM attendees
            GROUP BY order_num
          ) as a 
          ON o.order_num = a.order_num
        GROUP BY o.order_num) as grouped_orders
        ) as online_sales_data, 
        (SELECT SUM(net_sales) as door_ticket_revenue FROM square_door_sales WHERE category = 'Ticket') as door_sales_data
        `

    const [salesResult, salesFields] = await connection.execute(salesQuery);

    const online_ticket_total = salesResult[0]['online_ticket_revenue'];
    const door_ticket_total = salesResult[0]['door_ticket_revenue'];
    
    const totalRevenue = (parseFloat(online_ticket_total) + parseFloat(door_ticket_total)).toFixed(2);

    const response = {
      attendees: {
        totalCount: sumCounts(attendeeData),
        stats: attendeeData
      },
      ticket: {
        count: sumCounts(attendeeData)
      },
      revenue: {
        online_ticket_total,
        door_ticket_total,
        bar_split_total: 0,
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