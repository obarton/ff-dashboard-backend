import { GetAttendeesSQL, GetCurrentMonthFacebookSocialReachQuery, GetFacebookSocialReachQuery, GetOrdersSQL, GetPreviousMonthFacebookSocialReachQuery, GetRepeatCheckInsQuery, GetSalesSQL } from "@dashboard-backend/core/sqlQueries";

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

    const [ordersResult] = await connection.execute(GetOrdersSQL);
    const [attendeeResult] = await connection.execute(GetAttendeesSQL);
    const [salesResult] = await connection.execute(GetSalesSQL);
    const [repeatCheckInsResult] = await connection.execute(GetRepeatCheckInsQuery);
    const [facebookSocialReachResult] = await connection.execute(GetFacebookSocialReachQuery);
    const [currentMonthFacebookSocialReachResult] = await connection.execute(GetCurrentMonthFacebookSocialReachQuery);
    const [previousMonthFacebookSocialReachResult] = await connection.execute(GetPreviousMonthFacebookSocialReachQuery);

    const attendeeData = attendeeResult.map((record: any) => {
      return {
        status: record['attendee_status'],
        count: record['Count(*)']
      }
    });

    const recentReach = {
      currentMonth: {
        month: currentMonthFacebookSocialReachResult[0].month,
        facebook: {
          reach: currentMonthFacebookSocialReachResult.filter((r: any) => r.platform === "facebook")[0].total_reach
        },
        instagram: {
          reach: currentMonthFacebookSocialReachResult.filter((r: any) => r.platform === "instagram")[0].total_reach
        }
      },
      previousMonth: {
        month: previousMonthFacebookSocialReachResult[0].month,
        facebook: {
          reach: previousMonthFacebookSocialReachResult.filter((r: any) => r.platform === "facebook")[0].total_reach
        },
        instagram: {
          reach: previousMonthFacebookSocialReachResult.filter((r: any) => r.platform === "instagram")[0].total_reach
        }
      },
    }
    console.log(`recentReach ${JSON.stringify(recentReach, null, 2)}`)

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
      },
      reach: {
        facebook: facebookSocialReachResult,
        ...recentReach
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