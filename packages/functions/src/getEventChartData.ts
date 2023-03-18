import moment from "moment";

const mysql = require('mysql2/promise');

function combineArrays(onlineSalesArray: any[], doorSalesArray: any[]) {
  let combinedArray: any[] = [];
  let doorArray = doorSalesArray;
  
  onlineSalesArray.forEach((onlineSaleItem) => {
    doorSalesArray.forEach((doorSaleItem) => {
      const doorSalesArrayContainsDate = doorArray.filter((doorItem: any) =>  onlineSaleItem.event_date === doorItem.event_date).length > 0; 
      const combinedArrayContainsDate = combinedArray.filter((combinedItem: any) => onlineSaleItem.event_date === combinedItem.event_date).length > 0;

      if (!doorSalesArrayContainsDate && !combinedArrayContainsDate) {
        combinedArray.push({
          event_name: onlineSaleItem.event_name,
          event_date: onlineSaleItem.event_date,
          total_revenue: onlineSaleItem.total_revenue,
          total_qty: onlineSaleItem.total_qty,
          total_door_revenue: 0.00,
          total_door_quantity: 0,
        });
      }

      if (onlineSaleItem.event_date === doorSaleItem.event_date) {
        combinedArray.push({
          event_name: onlineSaleItem.event_name,
          event_date: onlineSaleItem.event_date,
          total_revenue: onlineSaleItem.total_revenue,
          total_qty: onlineSaleItem.total_qty,
          total_door_revenue: doorSaleItem.total_door_revenue,
          total_door_quantity: doorSaleItem.total_door_quantity,
        });
      }
    });
  });
  
  return combinedArray;
}

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
    const [eventData] = await connection.execute(eventsQuery);

    const doorSalesQuery = `SELECT date, time, SUM(gross_sales) as total_daily_revenue, SUM(quantity) as total_daily_quantity FROM square_door_sales
    GROUP BY date
    ORDER BY date;
    `
    const [doorSalesData] = await connection.execute(doorSalesQuery);

    const parsedDoorData = doorSalesData.map((saleData: any) => {
      const { date, time, total_daily_revenue, total_daily_quantity} = saleData;
      const dateString = moment(new Date(date)).toLocaleString();
      const datetime = new Date(dateString)

      return {
        datetime,
        total_daily_revenue,
        total_daily_quantity
      }
    })

    let finalArray: any = [];
    let shouldSkipIndices: any = [];

    for (let index = 0; index < parsedDoorData.length; index++) {
      if (shouldSkipIndices.includes(index)) {
        continue;
      }

      const currentDateElement = parsedDoorData[index];
      const currentDate = moment(currentDateElement.datetime);
      const nextDay = moment(currentDateElement.datetime).add(1, 'days');
      
      const arrayContainsNextDay = parsedDoorData.filter((item: any) =>  moment(item.datetime).toString() === nextDay.toString()).length > 0;
      
      if (arrayContainsNextDay) {
        const nextDateElement = parsedDoorData[index + 1];
        const currentDateElementDateTime = currentDateElement.datetime
        const total_door_revenue = parseFloat(currentDateElement.total_daily_revenue) + parseFloat(nextDateElement.total_daily_revenue)
        const total_door_quantity = parseFloat(currentDateElement.total_daily_quantity) + parseFloat(nextDateElement.total_daily_quantity)
        shouldSkipIndices.push(index + 1)
        const eventDate = moment(currentDateElementDateTime).format('MM/DD/YY');

        const finalDateElement = {
          event_date: eventDate,
          total_door_revenue,
          total_door_quantity
        }
        
        finalArray.push(finalDateElement)
      } else {     
        const eventDate = moment(currentDateElement.datetime).format('MM/DD/YY');

        const element = {
          event_date: eventDate,
          total_door_revenue: currentDateElement.total_daily_revenue,
          total_door_quantity: currentDateElement.total_daily_quantity
        }

        finalArray.push(element)
      }
  
    }

    const data = eventData.map((item: any) => {
      return {
          ...item,
          event_date: moment(item.event_date).format('MM/DD/YY')
      }
    })

    const result = combineArrays(data, finalArray)
    const response = { 
      data : result
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