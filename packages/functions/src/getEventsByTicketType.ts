import moment from "moment";
const mysql = require('mysql2/promise');

const constructEventsArray = (arr: any[]) => {
    const result: any[] = [];
    const map = new Map();
    
    arr.forEach(event => {
      if (map.has(event.event_id)) {
        const index = map.get(event.event_id);
        
        result[index]['free_order'] ?? {
            order_total: 0.00,
            order_qty: 0
        };
        result[index]['paid_order'] ?? {
            order_total: 0.00,
            order_qty: 0
        };

        switch (event.order_type) {
            case 'Free Order':
                result[index]['free_order'] = { 
                    order_total: parseFloat(event.order_total),
                    order_qty: event.order_qty
                }          
                break;
            case 'Eventbrite Completed':
                result[index]['paid_order'] = { 
                    order_total: parseFloat(event.order_total),
                    order_qty: event.order_qty
                }        
                break;
            default:
                break;
        }
      } else {
        map.set(event.event_id, result.length);
 
        event['free_order'] ?? {
            order_total: 0.00,
            order_qty: 0
        };
        event['paid_order'] ?? {
            order_total: 0.00,
            order_qty: 0
        };

        switch (event.order_type) {
            case 'Free Order':
                event['free_order'] = { 
                    order_total: parseFloat(event.order_total),
                    order_qty: event.order_qty
                }          
                break;
            case 'Eventbrite Completed':
                event['paid_order'] = { 
                    order_total: parseFloat(event.order_total),
                    order_qty: event.order_qty
                }        
                break;
            default:
                break;
        }

        const { event_id, event_name, event_date, free_order, paid_order } = event;

        result.push({ 
            event_id, 
            event_name, 
            event_date: moment(event_date).format('MM/DD/YY'), 
            free_order, 
            paid_order 
        });
      }
    });
    
    return result;
  }

export async function handler() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DB,
    });

    const eventsQuery = `SELECT events.event_id, events.event_name, event_date, order_type, SUM(total_paid) as order_total, COUNT(order_num) as order_qty FROM orders
        JOIN events on orders.event_id = events.event_id
        WHERE order_type IN ('Free Order', 'Eventbrite Completed')
        GROUP BY order_type, events.event_id
        ORDER BY events.event_id
    `
    const [eventsQueryData, eventFields] = await connection.execute(eventsQuery);

    const data = constructEventsArray(eventsQueryData)

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
        error
      }),
    };
  }
};