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

    const ordersQuery = `SELECT order_type, SUM(total_paid) as order_total, COUNT(order_num) as order_qty FROM orders
    JOIN events on orders.event_id = events.event_id
    GROUP BY order_type`
    const [ordersResult] = await connection.execute(ordersQuery);

    const attendeeQuery = `SELECT attendee_status, Count(*) FROM attendees 
    GROUP BY attendee_status`
    const [attendeeResult] = await connection.execute(attendeeQuery);
    
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

    const [salesResult] = await connection.execute(salesQuery);

    const repeatCheckInsQuery = `
      SELECT * FROM (
            SELECT Count(*) as repeat_check_in_count FROM (
                SELECT email, MIN(date_attending) as first_date_attending, MAX(date_attending) as latest_date_attending, MAX(check_in_date) as most_recent_check_in, COUNT(*) as num_dates_attended FROM
                    (
                        SELECT email, date_attending, check_in_date, COUNT(*) as event_attendee_count FROM attendees
                        WHERE attendee_status = 'Checked In'
                        GROUP BY email, date_attending
                        ORDER BY email
                    ) as attendee_dates_checked_in_counts
                    GROUP BY email
                    ORDER BY num_dates_attended DESC
            ) as dates_checked_in_counts_by_email
            WHERE num_dates_attended > 1
        ) as repeat_check_in_count,
        (
        -- Get one-time check ins count
            SELECT Count(*) as single_check_in_count FROM (
                SELECT email, MIN(date_attending) as first_date_attending, MAX(date_attending) as latest_date_attending, MAX(check_in_date) as most_recent_check_in, COUNT(*) as num_dates_attended FROM
                    (
                        SELECT email, date_attending, check_in_date, COUNT(*) as event_attendee_count FROM attendees
                        WHERE attendee_status = 'Checked In'
                        GROUP BY email, date_attending
                        ORDER BY email
                    ) as attendee_dates_checked_in_counts
                    GROUP BY email
                    ORDER BY num_dates_attended DESC
            ) as dates_checked_in_counts_by_email
            WHERE num_dates_attended = 1
        ) as single_check_in_count`

    const [repeatCheckInsResult] = await connection.execute(repeatCheckInsQuery);

    const attendeeData = attendeeResult.map((record: any) => {
      return {
        status: record['attendee_status'],
        count: record['Count(*)']
      }
    });

    const online_ticket_total = salesResult[0]['online_ticket_revenue'];
    const door_ticket_total = salesResult[0]['door_ticket_revenue'];
    
    const totalRevenue = (parseFloat(online_ticket_total) + parseFloat(door_ticket_total)).toFixed(2);

    const free = ordersResult.filter((order: any) => order.order_type === "Free Order")[0];
    const paid = ordersResult.filter((order: any) => order.order_type === "Eventbrite Completed")[0];
    const abandoned = ordersResult.filter((order: any) => order.order_type === "Abandoned")[0];
    const refunded = ordersResult.filter((order: any) => order.order_type === "Eventbrite Refunded")[0];

    const response = {
      attendees: {
        totalCount: sumCounts(attendeeData),
        stats: attendeeData,
        checkIns: repeatCheckInsResult[0]
      },
      orders: {
        free,
        paid,
        abandoned,
        refunded
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